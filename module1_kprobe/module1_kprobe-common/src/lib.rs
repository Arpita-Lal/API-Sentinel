#![no_std]

#[repr(C)]
#[derive(Clone, Copy)]
pub struct TcpEvent {
    pub src_ip: u32,
    pub dest_ip: u32,
    pub src_port: u16,
    pub dest_port: u16,
    pub payload_len: u32,
    pub direction: u8,
    pub payload: [u8; 1024],
}

#[cfg(feature = "user")]
unsafe impl aya::Pod for TcpEvent {}
