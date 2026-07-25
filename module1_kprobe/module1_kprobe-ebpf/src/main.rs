#![no_std]
#![no_main]

mod vmlinux;

use aya_ebpf::{
    macros::kprobe, 
    programs::ProbeContext,
    helpers::bpf_probe_read_kernel
};
use aya_log_ebpf::info;
use crate::vmlinux::{sock, sock_common};

#[kprobe]
pub fn module1_kprobe(ctx: ProbeContext) -> u32 {
    match try_module1_kprobe(ctx) {
        Ok(ret) => ret,
        Err(ret) => ret,
    }
}

fn try_module1_kprobe(ctx: ProbeContext) -> Result<u32, u32> {
    // int tcp_sendmsg(struct sock *sk, struct msghdr *msg, size_t size);
    // read socket 
    let sk: *const sock = ctx.arg(0).ok_or(0u32)?;
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
    
    let size: usize = ctx.arg(2).ok_or(0u32)?; 
    // info!(&ctx, "kprobe called");
    info!(&ctx, "tcp_sendmsg size: {} src_ip: {} src_port: {} dest_ip: {} dest_port: {}", size, src_ip, src_port, dest_ip, dest_port);
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
