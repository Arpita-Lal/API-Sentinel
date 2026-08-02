use aya::{
    programs::KProbe,
    maps::perf::{PerfEventArray, PerfEvent},
    util::online_cpus,
};
use log::{debug, warn};
use tokio::signal;
use tokio::io::unix::AsyncFd;
use tokio::io::Interest;
use std::net::Ipv4Addr;
use module1_kprobe_common::TcpEvent;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::init();

    // Bump the memlock rlimit. This is needed for older kernels that don't use the
    // new memcg based accounting, see https://lwn.net/Articles/837122/
    let rlim = libc::rlimit {
        rlim_cur: libc::RLIM_INFINITY,
        rlim_max: libc::RLIM_INFINITY,
    };
    let ret = unsafe { libc::setrlimit(libc::RLIMIT_MEMLOCK, &rlim) };
    if ret != 0 {
        debug!("remove limit on locked memory failed, ret is: {ret}");
    }

    // This will include your eBPF object file as raw bytes at compile-time and load it at
    // runtime. This approach is recommended for most real-world use cases. If you would
    // like to specify the eBPF program at runtime rather than at compile-time, you can
    // reach for `Bpf::load_file` instead.
    let mut ebpf = aya::Ebpf::load(aya::include_bytes_aligned!(concat!(
        env!("OUT_DIR"),
        "/module1_kprobe"
    )))?;
    let mut perf_array = PerfEventArray::try_from(ebpf.take_map("TCP_EVENTS").unwrap())?;

    for cpu_id in online_cpus().unwrap() {
        let buf = perf_array.open(cpu_id, None)?;

        tokio::task::spawn(async move {
            let mut async_buf = AsyncFd::with_interest(buf, Interest::READABLE).unwrap();

            loop {
                let mut guard = async_buf.readable_mut().await.unwrap();
                guard.get_inner_mut().for_each(|event| {
                    match event {
                        PerfEvent::Sample { head, tail } => {
                            let mut event_bytes = Vec::with_capacity(head.len() + tail.len());
                            event_bytes.extend_from_slice(head);
                            event_bytes.extend_from_slice(tail);
                            
                            if event_bytes.len() < std::mem::size_of::<TcpEvent>() {
                                return;
                            }
                            
                            let ptr = event_bytes.as_ptr() as *const TcpEvent;
                            let event = unsafe { ptr.read_unaligned() };
                            
                            let src_ip = Ipv4Addr::from(event.src_ip.to_be());
                            let dest_ip = Ipv4Addr::from(event.dest_ip.to_be());
                            
                            let direction = if event.direction == 0 { "send" } else { "recv" };
                            let payload_len = event.payload_len as usize;
                            let payload = &event.payload[..payload_len];
                            
                            // Simple hex encoding
                            let mut payload_hex = String::with_capacity(payload_len * 2);
                            for b in payload {
                                payload_hex.push_str(&format!("{:02x}", b));
                            }
                            
                            // Output structured JSON
                            println!(
                                "{{\"src_ip\": \"{}\", \"dest_ip\": \"{}\", \"src_port\": {}, \"dest_port\": {}, \"direction\": \"{}\", \"payload_len\": {}, \"payload_hex\": \"{}\"}}",
                                src_ip, dest_ip, event.src_port, event.dest_port, direction, payload_len, payload_hex
                            );
                            let _ = std::io::Write::flush(&mut std::io::stdout());
                        }
                        PerfEvent::Lost { count } => {
                            warn!("Lost {} events", count);
                        }
                    }
                });
                guard.clear_ready();
            }
        });
    }
    let program: &mut KProbe = ebpf.program_mut("module1_kprobe").unwrap().try_into()?;
    program.load()?;
    program.attach("tcp_sendmsg", 0)?;

    let recv_entry: &mut KProbe = ebpf.program_mut("module1_kprobe_recv").unwrap().try_into()?;
    recv_entry.load()?;
    recv_entry.attach("tcp_recvmsg", 0)?;

    let recv_exit: &mut KProbe = ebpf.program_mut("module1_kretprobe_recv").unwrap().try_into()?;
    recv_exit.load()?;
    recv_exit.attach("tcp_recvmsg", 0)?;

    let ctrl_c = signal::ctrl_c();
    println!("Waiting for Ctrl-C...");
    ctrl_c.await?;
    println!("Exiting...");

    Ok(())
}
