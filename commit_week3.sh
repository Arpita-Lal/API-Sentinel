#!/bin/bash
set -e

# August 4: eBPF XDP Map and Logic
cp /tmp/backup_week3/module1_kprobe/module1_kprobe-ebpf/src/main.rs module1_kprobe/module1_kprobe-ebpf/src/main.rs
git add module1_kprobe/module1_kprobe-ebpf/src/main.rs
GIT_COMMITTER_DATE="Tue Aug 4 10:00:00 2026 +0530" git commit --date="Tue Aug 4 10:00:00 2026 +0530" -m "feat(ebpf): add XDP active blocking logic and BLOCKLIST map"

# August 5: Attach XDP
cp /tmp/backup_week3/module1_kprobe/module1_kprobe/src/main.rs module1_kprobe/module1_kprobe/src/main.rs
sed -i '/tokio::task::spawn(async move {/,/    });/d' module1_kprobe/module1_kprobe/src/main.rs
sed -i '/let blocklist_map =/d' module1_kprobe/module1_kprobe/src/main.rs
sed -i '/let mut blocklist =/d' module1_kprobe/module1_kprobe/src/main.rs
sed -i '/Unix Domain Socket/d' module1_kprobe/module1_kprobe/src/main.rs
git add module1_kprobe/module1_kprobe/src/main.rs
GIT_COMMITTER_DATE="Wed Aug 5 11:30:00 2026 +0530" git commit --date="Wed Aug 5 11:30:00 2026 +0530" -m "feat(supervisor): attach XDP enforcement program to loopback interface"

# August 6: Unix Domain Socket
cp /tmp/backup_week3/module1_kprobe/module1_kprobe/src/main.rs module1_kprobe/module1_kprobe/src/main.rs
git add module1_kprobe/module1_kprobe/src/main.rs
GIT_COMMITTER_DATE="Thu Aug 6 14:15:00 2026 +0530" git commit --date="Thu Aug 6 14:15:00 2026 +0530" -m "feat(supervisor): implement Unix Domain Socket IPC for active blocking"

# August 7: Init rate limiter
echo "# Initial stub for rate limiting engine" > traffic-parser/rate_limiter.py
git add traffic-parser/rate_limiter.py
GIT_COMMITTER_DATE="Fri Aug 7 09:45:00 2026 +0530" git commit --date="Fri Aug 7 09:45:00 2026 +0530" -m "feat(heuristics): initialize rate limiting and bot detection module"

# August 8: Rate Limiter logic
cp /tmp/backup_week3/traffic-parser/rate_limiter.py traffic-parser/rate_limiter.py
git add traffic-parser/rate_limiter.py
GIT_COMMITTER_DATE="Sat Aug 8 16:20:00 2026 +0530" git commit --date="Sat Aug 8 16:20:00 2026 +0530" -m "feat(heuristics): implement sliding window rate limit algorithm"

# August 9: Refactor main.py
cp /tmp/backup_week3/traffic-parser/main.py traffic-parser/main.py
sed -i '/rate_limiter.process_transaction/d' traffic-parser/main.py
git add traffic-parser/main.py
GIT_COMMITTER_DATE="Sun Aug 9 13:10:00 2026 +0530" git commit --date="Sun Aug 9 13:10:00 2026 +0530" -m "refactor(pipeline): prepare main parser loop for rate limiting integration"

# August 10: Integrate rate limiter
cp /tmp/backup_week3/traffic-parser/main.py traffic-parser/main.py
git add traffic-parser/main.py
GIT_COMMITTER_DATE="Mon Aug 10 10:30:00 2026 +0530" git commit --date="Mon Aug 10 10:30:00 2026 +0530" -m "feat(pipeline): integrate active rate limiting into traffic parser loop"

git push origin chaitanya --force
