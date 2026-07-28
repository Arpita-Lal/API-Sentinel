#![no_std]
#![no_main]

mod vmlinux;

use aya_ebpf::{
    macros::{kprobe, kretprobe, map}, 
    programs::{ProbeContext, RetProbeContext},
    helpers::{bpf_probe_read_kernel, bpf_get_current_pid_tgid},
    maps::{HashMap, PerfEventArray, PerCpuArray},
};
use module1_kprobe_common::TcpEvent;
use crate::vmlinux::{sock, sock_common, msghdr, iov_iter, iovec};

#[map]
static TCP_EVENTS: PerfEventArray<TcpEvent> = PerfEventArray::new(0);

#[map]
static TCP_EVENT_SCRATCH: PerCpuArray<TcpEvent> = PerCpuArray::with_max_entries(1, 0);

#[repr(C)]
#[derive(Copy, Clone)]
struct ConnectionContext {
    sk: u64,
    msg: u64,
}

#[map]
static RECV_CONTEXT: HashMap<u64, ConnectionContext> = HashMap::with_max_entries(1024, 0);

#[inline(always)]
unsafe fn get_iov_data(iter: &iov_iter) -> Option<(*const u8, usize)> {
    // 1. Try ubuf (direct user pointer for single buffer)
    let ubuf = iter.__bindgen_anon_1.__bindgen_anon_1.__bindgen_anon_1.ubuf;
    if !ubuf.is_null() {
        let count = iter.__bindgen_anon_1.__bindgen_anon_1.count;
        return Some((ubuf as *const u8, count));
    }

    // 2. Try __iov (pointer to array of iovec)
    let iov_ptr = iter.__bindgen_anon_1.__bindgen_anon_1.__bindgen_anon_1.__iov;
    if !iov_ptr.is_null() {
        if let Ok(iov) = bpf_probe_read_kernel(iov_ptr) {
            if !iov.iov_base.is_null() && iov.iov_len > 0 {
                return Some((iov.iov_base as *const u8, iov.iov_len as usize));
            }
        }
    }

    None
}



#[kprobe]
pub fn module1_kprobe(ctx: ProbeContext) -> u32 {
    match try_module1_kprobe(ctx) {
        Ok(ret) => ret,
        Err(ret) => ret,
    }
}

#[inline(always)]
fn try_module1_kprobe(ctx: ProbeContext) -> Result<u32, u32> {
    // int tcp_sendmsg(struct sock *sk, struct msghdr *msg, size_t size);
    let sk: *const sock = ctx.arg(0).ok_or(0u32)?;
    let msg: *const msghdr = ctx.arg(1).ok_or(0u32)?;
    let size: usize = ctx.arg(2).ok_or(0u32)?;

    let msghdr_val = unsafe { bpf_probe_read_kernel(msg).map_err(|_| 0u32)? };

    let common: sock_common =
        unsafe { bpf_probe_read_kernel(&(*sk).__sk_common).map_err(|_| 0u32)? };

    // Access connection data
    let src_ip = unsafe {
        common.__bindgen_anon_1.__bindgen_anon_1.skc_rcv_saddr
    };

    let dest_ip = unsafe {
        common.__bindgen_anon_1.__bindgen_anon_1.skc_daddr
    };

    let dest_port = unsafe {
        u16::from_be(common.__bindgen_anon_3.__bindgen_anon_1.skc_dport)
    };

    let src_port = unsafe {
        common.__bindgen_anon_3.__bindgen_anon_1.skc_num
    };
    
    // Task 5: Port filtering
    if src_port != 8080 && dest_port != 8080 {
        return Ok(0);
    }
    
    let event_ptr = unsafe { TCP_EVENT_SCRATCH.get_ptr_mut(0) };
    let event = match event_ptr {
        Some(ptr) => unsafe { &mut *ptr },
        None => return Ok(0),
    };

    event.src_ip = src_ip;
    event.dest_ip = dest_ip;
    event.src_port = src_port;
    event.dest_port = dest_port;
    event.direction = 0; // 0 for send
    event.payload_len = 0;

    if size > 0 {
        if let Some((user_ptr, _)) = unsafe { get_iov_data(&msghdr_val.msg_iter) } {
            let read_len = if size < 1024 { size } else { 1024 };
            if unsafe { aya_ebpf::helpers::bpf_probe_read_user_buf(user_ptr, &mut event.payload[..read_len]) }.is_ok() {
                event.payload_len = read_len as u32;
            }
        }
    }

    unsafe { TCP_EVENTS.output(&ctx, event, 0) };

    Ok(0)
}

#[kprobe]
pub fn module1_kprobe_recv(ctx: ProbeContext) -> u32 {
    match try_module1_kprobe_recv(ctx) {
        Ok(ret) => ret,
        Err(ret) => ret,
    }
}

#[inline(always)]
fn try_module1_kprobe_recv(ctx: ProbeContext) -> Result<u32, u32> {
    // int tcp_recvmsg(struct sock *sk, struct msghdr *msg, size_t len, int flags, int *addr_len);
    let sk: *const sock = ctx.arg(0).ok_or(0u32)?;
    let msg: *const msghdr = ctx.arg(1).ok_or(0u32)?;
    let pid_tgid = bpf_get_current_pid_tgid();
    let context = ConnectionContext {
        sk: sk as u64,
        msg: msg as u64,
    };
    RECV_CONTEXT.insert(&pid_tgid, &context, 0).map_err(|_| 0u32)?;
    Ok(0)
}

#[kretprobe]
pub fn module1_kretprobe_recv(ctx: RetProbeContext) -> u32 {
    match try_module1_kretprobe_recv(ctx) {
        Ok(ret) => ret,
        Err(ret) => ret,
    }
}

#[inline(always)]
fn try_module1_kretprobe_recv(ctx: RetProbeContext) -> Result<u32, u32> {
    let pid_tgid = bpf_get_current_pid_tgid();
    let context_ptr = unsafe { RECV_CONTEXT.get(&pid_tgid) };
    if let Some(&context) = context_ptr {
        // Clean up from map
        let _ = RECV_CONTEXT.remove(&pid_tgid);

        let sk = context.sk as *const sock;
        let msg = context.msg as *const msghdr;

        let ret_val: i32 = ctx.ret();
        if ret_val <= 0 {
            return Ok(0);
        }
        let size = ret_val as usize;

        let msghdr_val = unsafe { bpf_probe_read_kernel(msg).map_err(|_| 0u32)? };

        let common: sock_common =
            unsafe { bpf_probe_read_kernel(&(*sk).__sk_common).map_err(|_| 0u32)? };

        // Access connection data
        let src_ip = unsafe {
            common.__bindgen_anon_1.__bindgen_anon_1.skc_rcv_saddr
        };

        let dest_ip = unsafe {
            common.__bindgen_anon_1.__bindgen_anon_1.skc_daddr
        };

        let dest_port = unsafe {
            u16::from_be(common.__bindgen_anon_3.__bindgen_anon_1.skc_dport)
        };

        let src_port = unsafe {
            common.__bindgen_anon_3.__bindgen_anon_1.skc_num
        };

        // Task 5: Port filtering
        if src_port != 8080 && dest_port != 8080 {
            return Ok(0);
        }

        let event_ptr = unsafe { TCP_EVENT_SCRATCH.get_ptr_mut(0) };
        let event = match event_ptr {
            Some(ptr) => unsafe { &mut *ptr },
            None => return Ok(0),
        };

        event.src_ip = src_ip;
        event.dest_ip = dest_ip;
        event.src_port = src_port;
        event.dest_port = dest_port;
        event.direction = 1; // 1 for recv
        event.payload_len = 0;

        if size > 0 {
            if let Some((user_ptr, _)) = unsafe { get_iov_data(&msghdr_val.msg_iter) } {
                let read_len = if size < 1024 { size } else { 1024 };
                if unsafe { aya_ebpf::helpers::bpf_probe_read_user_buf(user_ptr, &mut event.payload[..read_len]) }.is_ok() {
                    event.payload_len = read_len as u32;
                }
            }
        }

        unsafe { TCP_EVENTS.output(&ctx, event, 0) };
    }
    Ok(0)
}

#[cfg(not(test))]
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

#[unsafe(link_section = "license")]
#[unsafe(no_mangle)]
static LICENSE: [u8; 13] = *b"Dual MIT/GPL\0";
