// Diagrams for the Operating System equation groups (see EQUATION_PLAN.md §5).
// Each diagram carries one set of concrete numbers (2500 → Page 2 + 452 → 5572,
// 6000 RPM, 16 KB / 64 B), so a value can be followed through the picture.

import { Arrow, C1, C2, C3, C4, Cell, Dim, Limit, Step, VDim, tint } from './parts.jsx'

const MUTED = 'var(--text-3)'

// Plain label; `sub` makes it the quieter secondary style.
function Label({ x, y, children, anchor = 'start', color = 'var(--text-2)', sub, size }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size || (sub ? 11 : 12)}
      fontWeight={sub ? 500 : 700} fill={sub ? MUTED : color}>{children}</text>
  )
}

// An address ruler: memory as slots of one Page size (100 px = 1024 byte here),
// with the numbered boundaries under it. `slots` lists slot numbers left to right;
// `null` draws a break for slots left out. Measured under it: the whole slots
// before the target (the start of slot `on`) and the Offset inside it.
const SLOT = 100, OFF = 452 / 1024 * SLOT
function AddressRuler({ y, color, name, slots, on, marker, startLabel, startTerm }) {
  let x = 20
  const cells = slots.map(n => {
    const c = { n, x, w: n === null ? 40 : SLOT }
    x += c.w
    return c
  })
  const hit = cells.find(c => c.n === on)
  const mark = hit.x + OFF
  return (
    <g>
      {cells.map(c => c.n === null ? (
        <g key="gap">
          <text x={c.x + c.w / 2} y={y + 16} textAnchor="middle" fontSize="14" fill={MUTED}>⋯</text>
          <text x={c.x + c.w / 2} y={y + 32} textAnchor="middle" fontSize="9" fill={MUTED}>{name} 2, 3</text>
          <text x={c.x} y={y + 54} textAnchor="middle" fontSize="10.5" fill={MUTED}>{slots[slots.indexOf(null) - 1] * 1024 + 1024}</text>
        </g>
      ) : (
        <g key={c.n}>
          <rect x={c.x} y={y} width={c.w} height={40} rx="4"
            fill={c.n === on ? tint(color, 24) : 'var(--surface)'} stroke={c.n === on ? color : 'var(--border-md)'} strokeWidth={c.n === on ? 1.5 : 1} />
          <text x={c.x + c.w / 2} y={y + 16} textAnchor="middle" fontSize="11.5" fontWeight={c.n === on ? 700 : 500}
            fill={c.n === on ? color : MUTED}>{name} {c.n}</text>
          <text x={c.x} y={y + 54} textAnchor="middle" fontSize="10.5" fill={MUTED}>{c.n * 1024}</text>
        </g>
      ))}
      <text x={x} y={y + 54} textAnchor="middle" fontSize="10.5" fill={MUTED}>{(slots[slots.length - 1] + 1) * 1024}</text>

      <line x1={mark} y1={y + 20} x2={mark} y2={y + 40} stroke="var(--text)" strokeWidth="2" />
      <text x={mark + 4} y={y + 35} fontSize="11.5" fontWeight="700" fill="var(--text)">{marker}</text>

      <Dim x1={20} x2={hit.x} y={y + 72} color={color} label={startLabel} below />
      <Label x={(20 + hit.x) / 2} y={y + 110} anchor="middle" sub>{startTerm}</Label>
      <Dim x1={hit.x} x2={mark} y={y + 72} color={C2} label="" below />
      <Label x={mark + 8} y={y + 94} color={C2}>Offset<Limit>452</Limit></Label>
      <Label x={mark + 8} y={y + 110} sub>{name}-এর ভেতরে বাকি দূরত্ব</Label>
    </g>
  )
}

function PagingTranslateDiagram() {
  const ROW = 20, TOP = 82          // page table: first data row starts at TOP
  const table = [[0, 3], [1, 7], [2, 5], [3, 1]]
  const rowY = (i) => TOP + i * ROW
  return (
    <svg viewBox="0 0 640 512" role="img" aria-label="Logical Address থেকে Physical Address: Page Number বদলে Frame Number, Offset একই">
      {/* Offset is copied across unchanged */}
      <Arrow pts={[[205, 72], [205, 16], [612, 16], [612, 70]]} color={C2} dashed />
      <Label x={408} y={32} anchor="middle" color={C2}>Offset একই থাকে<Limit>452</Limit></Label>

      {/* Logical Address, split by the Page size */}
      <Label x={120} y={62} anchor="middle" color="var(--text)">Logical Address<Limit>2500</Limit></Label>
      <Cell x={20} y={72} w={100} h={44} color={C3} title="Page Number" sub="2" />
      <Cell x={120} y={72} w={100} h={44} color={C2} title="Offset" sub="452" />

      {/* Page table: page -> frame */}
      <Label x={325} y={54} anchor="middle" color="var(--text)">Page table</Label>
      <rect x={270} y={62} width={110} height={ROW} fill="var(--elevated)" stroke="var(--border-md)" />
      <Label x={297} y={76} anchor="middle" sub>Page</Label>
      <Label x={353} y={76} anchor="middle" sub>Frame</Label>
      {table.map(([pg, fr], i) => {
        const on = pg === 2
        return (
          <g key={pg}>
            <rect x={270} y={rowY(i)} width={110} height={ROW}
              fill={on ? tint(C3, 26) : 'var(--surface)'} stroke={on ? C3 : 'var(--border-md)'} strokeWidth={on ? 1.5 : 1} />
            <line x1={325} y1={rowY(i)} x2={325} y2={rowY(i) + ROW} stroke="var(--border-md)" />
            <text x={297} y={rowY(i) + 14} textAnchor="middle" fontSize="12" fontWeight={on ? 700 : 500} fill={on ? C3 : MUTED}>{pg}</text>
            <text x={353} y={rowY(i) + 14} textAnchor="middle" fontSize="12" fontWeight={on ? 700 : 500} fill={on ? C1 : MUTED}>{fr}</text>
          </g>
        )
      })}
      <Arrow pts={[[70, 116], [70, rowY(2) + 10], [268, rowY(2) + 10]]} color={C3} />
      <Arrow pts={[[382, rowY(2) + 10], [480, rowY(2) + 10], [480, 118]]} color={C1} />

      {/* Physical Address */}
      <Label x={530} y={62} anchor="middle" color="var(--text)">Physical Address<Limit>5572</Limit></Label>
      <Cell x={430} y={72} w={100} h={44} color={C1} title="Frame Number" sub="5" />
      <Cell x={530} y={72} w={100} h={44} color={C2} title="Offset" sub="452" />

      {/* Why dividing works: an address is a spot on a ruler marked every 1024 */}
      <Label x={20} y={196} color="var(--text)">Logical memory<Limit>2500 ÷ 1024 = 2.44: 2 টি পুরো page পার হয়েছে, তাই 2500 আছে Page 2-এ</Limit></Label>
      <AddressRuler y={210} color={C3} name="Page"
        slots={[0, 1, 2, 3]} on={2} marker="2500"
        startLabel="2 × 1024 = 2048" startTerm="Page Number × Page size" />

      {/* The same offset, measured from the start of frame 5 instead */}
      <Label x={20} y={372} color="var(--text)">Physical memory (RAM)<Limit>page table বলছে Page 2 → Frame 5; ভেতরের দূরত্ব 452 একই</Limit></Label>
      <AddressRuler y={386} color={C1} name="Frame"
        slots={[0, 1, null, 4, 5, 6]} on={5} marker="5572"
        startLabel="5 × 1024 = 5120 = Base Address" startTerm="Frame Number × Page size" />
    </svg>
  )
}

const MONO = "'JetBrains Mono', monospace"

// Why Offset bits = log₂(Page size): an offset is just the byte's number inside
// the page, so a page of N bytes needs N different offsets, and n bits can write
// exactly 2ⁿ different numbers. Then the same idea on the real 2500 example:
// dividing by 1024 = 2¹⁰ is the same as cutting off the last 10 bits.
function OffsetBitsExplained() {
  const bin = (n, w) => n.toString(2).padStart(w, '0')
  const bits2500 = bin(2500, 12).split('')      // 1001 1100 0100
  return (
    <g>
      <Label x={20} y={20} color="var(--text)">ছোট উদাহরণ: Page size 8 byte<Limit>প্রতিটি byte-এর নম্বরই তার Offset</Limit></Label>
      {Array.from({ length: 8 }, (_, k) => (
        <g key={k}>
          <rect x={60 + k * 65} y={32} width={65} height={40} rx="3" fill={tint(C2, 16)} stroke={C2} />
          <text x={92 + k * 65} y={50} textAnchor="middle" fontSize="11" fill={MUTED}>byte</text>
          <text x={92 + k * 65} y={66} textAnchor="middle" fontSize="13" fontWeight="700" fill={C2}>{k}</text>
          <text x={92 + k * 65} y={92} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)" fontFamily={MONO}>{bin(k, 3)}</text>
        </g>
      ))}
      <Label x={52} y={92} anchor="end" sub>binary</Label>
      <Dim x1={60} x2={580} y={108} color={C2} label="Page size = 8 byte, তাই Offset 0 থেকে 7: মোট 8 টি আলাদা Offset" below />
      <Label x={320} y={154} anchor="middle" color="var(--text)">8 টি নম্বর লিখতে 3 bit লাগে (000 থেকে 111), কারণ 2³ = 8<Limit>Offset bits = log₂ 8 = 3</Limit></Label>

      <Label x={320} y={174} anchor="middle" sub>1 bit → 2 টি · 2 bit → 4 টি · 3 bit → 8 টি · … · 10 bit → 1024 টি · 12 bit → 4096 টি নম্বর</Label>


      <Label x={20} y={214} color="var(--text)">একই কথা 2500-এ<Limit>Page size 1024 = 2¹⁰, তাই Offset bits 10</Limit></Label>
      {/* Each part is read on its own: a bit's place value doubles from the right
          (1, 2, 4, …), and the number is the sum of the places holding a 1. */}
      <Label x={72} y={236} anchor="end" sub>ঘরের মান</Label>
      {bits2500.map((b, k) => {
        const page = k < 2, x = 80 + k * 40
        const place = 2 ** (page ? 1 - k : 11 - k)
        const color = page ? C3 : C2
        return (
          <g key={k}>
            <text x={x + 20} y={236} textAnchor="middle" fontSize="11" fontWeight={b === '1' ? 700 : 400}
              fill={b === '1' ? color : MUTED}>{place}</text>
            <rect x={x} y={244} width={40} height={34} rx="3" fill={tint(color, 18)} stroke={color} />
            <text x={x + 20} y={266} textAnchor="middle" fontSize="15" fontWeight="700" fill={color} fontFamily={MONO}>{b}</text>
          </g>
        )
      })}
      <Label x={72} y={266} anchor="end" sub>2500 =</Label>
      <Dim x1={80} x2={160} y={294} color={C3} label="Page Number" below />
      <Label x={120} y={334} anchor="middle" color={C3}>1×2 + 0×1 = 2</Label>
      <Dim x1={160} x2={560} y={294} color={C2} label="Offset: শেষের 10 bit" below />
      <Label x={360} y={334} anchor="middle" color={C2}>1 যেখানে: 256 + 128 + 64 + 4 = 452</Label>
      <Label x={320} y={360} anchor="middle" sub>1024 দিয়ে ভাগ করা মানে শেষের 10 bit কেটে আলাদা করা: ভাগফল উপরের bit, ভাগশেষ নিচের bit</Label>
    </g>
  )
}

function PageTableDiagram() {
  const rows = ['Page 0', 'Page 1', 'Page 2', '⋮', 'Page 511']
  const T = 256, H = 20
  const B = 28                                    // px per bit, same for both bars
  const offX = 600 - 11 * B                       // Offset is right-aligned in both
  return (
    <svg viewBox="0 0 640 814" role="img" aria-label="Offset bits কেন log₂(Page size), address bits যোগ আর page table-এর মাপ">
      <OffsetBitsExplained />
      <line x1={20} y1={380} x2={620} y2={380} stroke="var(--border-md)" strokeDasharray="4 4" />
      <Label x={20} y={402} color="var(--text)">Q25-এর মাপে<Limit>512 page, Page size 2 KB, 128 frame</Limit></Label>
      <g transform="translate(0, 400)">
        {/* Logical: page number bits, then offset bits. Widths are to scale. */}
        <Dim x1={offX - 9 * B} x2={600} y={34} color={C3} label={<>Logical Address bits<Limit>9 + 11 = 20</Limit></>} />
        <Cell x={offX - 9 * B} y={50} w={9 * B} h={44} color={C3} title="Page Number bits" sub="9 bit · 512 = 2⁹ page" />
        <Cell x={offX} y={50} w={11 * B} h={44} color={C2} title="Offset bits" sub="11 bit · Page size 2 KB = 2¹¹" />

        {/* Physical: frame number bits, then the SAME offset bits */}
        <Dim x1={offX - 7 * B} x2={600} y={122} color={C1} label={<>Physical Address bits<Limit>7 + 11 = 18</Limit></>} />
        <Cell x={offX - 7 * B} y={138} w={7 * B} h={44} color={C1} title="Frame Number bits" sub="7 bit · 128 = 2⁷ frame" />
        <Cell x={offX} y={138} w={11 * B} h={44} color={C2} title="Offset bits" sub="11 bit · একই" />

        <Label x={320} y={206} anchor="middle" color="var(--text)">bit-এ গুণ নয়, যোগ<Limit>512 × 2048 = 2⁹ × 2¹¹ = 2⁹⁺¹¹ = 2²⁰ টি address → 20 bit</Limit></Label>

        {/* Page table: one row per page */}
        <Arrow pts={[[60, 94], [60, 226], [345, 226], [345, T - 2]]} color={C3} />
        <Label x={352} y={246} sub>Page Number দিয়ে সারি বাছাই</Label>
        {rows.map((t, i) => {
          const on = i === 2
          return (
            <g key={t}>
              <rect x={250} y={T + i * H} width={190} height={H}
                fill={on ? tint(C3, 22) : 'var(--surface)'} stroke={on ? C3 : 'var(--border-md)'} />
              <text x={262} y={T + i * H + 14} fontSize="11.5" fontWeight={on ? 700 : 500} fill={on ? C3 : MUTED}>{t}</text>
              {t !== '⋮' && <text x={428} y={T + i * H + 14} textAnchor="end" fontSize="11" fill={MUTED}>→ Frame</text>}
            </g>
          )
        })}
        <VDim x={234} y1={T} y2={T + rows.length * H} color={C3} label={<>Number of pages<Limit>512</Limit></>} left />
        <VDim x={456} y1={T} y2={T + rows.length * H} color={C4} label="Page table size" />
        <Dim x1={250} x2={440} y={T + rows.length * H + 16} color={C4} label={<>Size of Page Table Entry<Limit>4 byte</Limit></>} below />
      </g>
    </svg>
  )
}

function TlbDiagram() {
  return (
    <svg viewBox="0 0 640 262" role="img" aria-label="TLB hit আর TLB miss-এ কোথায় কত সময় লাগে">
      <rect x={20} y={100} width={70} height={44} rx="10" fill="var(--elevated)" stroke="var(--border-md)" />
      <Label x={55} y={127} anchor="middle" color="var(--text)">CPU</Label>
      <Arrow pts={[[90, 114], [122, 114], [122, 66], [158, 66]]} color={C1} />
      <Label x={116} y={92} anchor="end" color={C1}>Hit ratio</Label>
      <Arrow pts={[[90, 130], [122, 130], [122, 172], [158, 172]]} color={C4} />
      <Label x={116} y={164} anchor="end" color={C4}>1 − Hit ratio</Label>

      {/* TLB hit: one memory trip. Widths are to scale: 20 ns vs 100 ns. */}
      <Dim x1={160} x2={400} y={30} color={C1} label={<>TLB hit: Hit time<Limit>120 ns</Limit></>} />
      <Cell x={160} y={46} w={40} h={40} color={C1} title="TLB" sub="20 ns" />
      <Cell x={200} y={46} w={200} h={40} color={C2} title="Memory access time" sub="100 ns · data আনা" />
      <Label x={410} y={70} sub>Frame Number TLB-তেই পাওয়া গেছে</Label>

      <Label x={180} y={124} anchor="middle" color={C1} size={11}>TLB access time</Label>

      {/* TLB miss: the page table is in memory too, so memory twice */}
      <Cell x={160} y={152} w={40} h={40} color={C1} title="TLB" sub="20 ns" />
      <Cell x={200} y={152} w={200} h={40} color={C4} title="Page table access time" sub="100 ns · page table-ও memory-তে" />
      <Cell x={400} y={152} w={200} h={40} color={C2} title="Memory access time" sub="100 ns · data আনা" />
      <Dim x1={160} x2={600} y={208} color={C4} label={<>TLB miss: Miss time<Limit>220 ns</Limit></>} below />

      <Label x={320} y={254} anchor="middle" sub>EAT: দুই পথ মিলিয়ে গড় Access time</Label>
    </svg>
  )
}

function HddDiagram() {
  const cx = 140, cy = 172
  const pol = (r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)]
  const wedge = (r1, r2, a1, a2) => {
    const [x1, y1] = pol(r2, a1), [x2, y2] = pol(r2, a2), [x3, y3] = pol(r1, a2), [x4, y4] = pol(r1, a1)
    return `M${x1},${y1} A${r2},${r2} 0 0 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 0 0 ${x4},${y4} Z`
  }
  const head = pol(102, 25)
  const secMid = pol(102, -35)
  const [rx1, ry1] = pol(126, 150), [rx2, ry2] = pol(126, 200)
  return (
    <svg viewBox="0 0 640 330" role="img" aria-label="Hard disk platter আর একটি sector পড়ার তিন ধাপ">
      {/* Platter from above: tracks are rings, sectors are slices of a ring */}
      <circle cx={cx} cy={cy} r={115} fill="var(--elevated)" stroke="var(--border-md)" />
      {[90, 65].map(r => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-md)" />)}
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = pol(90, i * 30), [x2, y2] = pol(115, i * 30)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-md)" />
      })}
      <circle cx={cx} cy={cy} r={102} fill="none" stroke={C4} strokeWidth="3" strokeOpacity="0.55" />
      <path d={wedge(90, 115, -50, -20)} fill={tint(C3, 45)} stroke={C3} strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={26} fill="var(--surface)" stroke="var(--border-md)" />

      {/* Rotation */}
      <path d={`M${rx1},${ry1} A126,126 0 0 1 ${rx2},${ry2}`} fill="none" stroke={C1} strokeWidth="1.5" />
      <Arrow pts={[pol(126, 196), [rx2, ry2]]} color={C1} />
      <Label x={6} y={116} color={C1}>RPM</Label>

      {/* Arm + head, and the seek movement across tracks */}
      <line x1={292} y1={296} x2={head[0]} y2={head[1]} stroke="var(--text-3)" strokeWidth="4" strokeLinecap="round" />
      <circle cx={292} cy={296} r={6} fill="var(--text-3)" />
      <rect x={head[0] - 6} y={head[1] - 6} width={12} height={12} rx="2" fill="var(--text-2)" />
      <Arrow pts={[pol(78, 25), pol(58, 25)]} color={C2} />
      <Arrow pts={[pol(84, 25), pol(116, 25)]} color={C2} />
      <Label x={pol(70, 40)[0]} y={pol(70, 40)[1] + 6} anchor="middle" color={C2} size={11}>Seek</Label>

      {/* Labels with leader lines */}
      <line x1={secMid[0]} y1={secMid[1]} x2={196} y2={40} stroke={C3} />
      <Label x={20} y={24} color={C3}>Sector<Limit>Bytes per sector = Data + Overhead</Limit></Label>
      <Label x={20} y={40} sub>এক sector-এর মাপ = Sector size</Label>
      <line x1={pol(102, 130)[0]} y1={pol(102, 130)[1]} x2={40} y2={308} stroke={C4} />
      <Label x={20} y={322} color={C4}>Track<Limit>এক track-এ Sectors per track টি sector; মোট Tracks</Limit></Label>

      {/* The three steps of reading one sector */}
      <Step x={346} y={60} n={1} color={C2} />
      <Label x={362} y={64} color={C2}>Seek time</Label>
      <Label x={362} y={80} sub>arm ঠিক track-এ সরে</Label>
      <Step x={346} y={108} n={2} color={C3} />
      <Label x={362} y={112} color={C3}>Avg Rotational time</Label>
      <Label x={362} y={128} sub>sector ঘুরে head-এর নিচে আসে · গড়ে অর্ধেক ঘূর্ণন</Label>
      <Step x={346} y={156} n={3} color={C1} />
      <Label x={362} y={160} color={C1}>Data transfer time</Label>
      <Label x={362} y={176} sub>Sector size পরিমাণ data, Transfer rate-এ পড়া</Label>
      <Label x={362} y={191} sub>এক ঘূর্ণনে পুরো এক track head-এর নিচ দিয়ে যায়</Label>

      {/* Timeline of one read. Seek and Rotation are to scale; Transfer (0.02 ms)
          would be a hairline, so it gets its own readable cell. */}
      <Cell x={336} y={214} w={112} h={36} color={C2} title="Seek" sub="5 ms" />
      <Cell x={448} y={214} w={112} h={36} color={C3} title="Rotation" sub="5 ms" />
      <Cell x={560} y={214} w={60} h={36} color={C1} title="Transfer" sub="0.02 ms" />
      <Dim x1={336} x2={620} y={266} color="var(--text-2)" label={<>Disk access time<Limit>10.02 ms</Limit></>} below />
    </svg>
  )
}

function CacheMappingDiagram() {
  const X0 = 170, PX = 440 / 32           // 32 address bits across 440 px
  const bx = (bits) => X0 + bits * PX     // x after `bits` bits from the left
  const G = 118, H = 22                   // cache grid top, row height
  const lines = ['line 0', 'line 1', 'line 2', '⋮', 'line 255']
  const tagX = bx(18) - 78, idxX = bx(18), offX = bx(26), end = bx(32)
  return (
    <svg viewBox="0 0 640 404" role="img" aria-label="Direct, Set Associative আর Fully Associative-এ address bit ভাগ">
      <Dim x1={X0} x2={end} y={20} color="var(--text-2)" label={<>Address bits<Limit>32</Limit></>} />

      {/* Direct mapping, with the cache it indexes */}
      <Label x={20} y={58} color="var(--text)">Direct</Label>
      <Cell x={X0} y={34} w={18 * PX} h={40} color={C4} title="Tag" sub="18 bit" />
      <Cell x={idxX} y={34} w={8 * PX} h={40} color={C1} title="Index" sub="8 bit" />
      <Cell x={offX} y={34} w={6 * PX} h={40} color={C2} title="Offset" sub="6 bit" />

      <Arrow pts={[[tagX + 39, 74], [tagX + 39, G - 2]]} color={C4} />
      <Label x={tagX + 33} y={100} anchor="end" color={C4} size={11}>Tag মিলিয়ে দেখা</Label>
      <Arrow pts={[[idxX + 55, 74], [idxX + 55, G - 2]]} color={C1} />
      <Label x={idxX + 61} y={100} color={C1} size={11}>কোন line</Label>
      <Arrow pts={[[offX + 41, 74], [offX + 41, G - 2]]} color={C2} />
      <Label x={offX + 47} y={100} color={C2} size={11}>কোন byte</Label>

      {lines.map((t, i) => {
        const y = G + i * H, on = i === 2, gap = t === '⋮'
        return (
          <g key={t}>
            <rect x={tagX} y={y} width={end - tagX} height={H}
              fill={on ? tint(C3, 24) : 'var(--surface)'} stroke={on ? C3 : 'var(--border-md)'} />
            <line x1={idxX} y1={y} x2={idxX} y2={y + H} stroke="var(--border-md)" />
            <line x1={offX} y1={y} x2={offX} y2={y + H} stroke="var(--border-md)" />
            {!gap && <text x={tagX + 39} y={y + 15} textAnchor="middle" fontSize="11" fill={on ? C4 : MUTED}>tag</text>}
            <text x={idxX + 55} y={y + 15} textAnchor="middle" fontSize="11" fontWeight={on ? 700 : 500} fill={on ? C1 : MUTED}>{t}</text>
            {!gap && Array.from({ length: 7 }, (_, k) => (
              <line key={k} x1={offX + (k + 1) * (end - offX) / 8} y1={y + 4} x2={offX + (k + 1) * (end - offX) / 8} y2={y + H - 4} stroke="var(--border-md)" />
            ))}
            {on && <rect x={offX + 3 * (end - offX) / 8} y={y + 3} width={(end - offX) / 8} height={H - 6} fill={C2} />}
          </g>
        )
      })}
      <Label x={tagX - 30} y={G + 16} anchor="end" color="var(--text)">Cache size<Limit>16 KB</Limit></Label>
      <VDim x={tagX - 16} y1={G + 26} y2={G + lines.length * H} color={C1} label={<>No. of cache lines<Limit>256</Limit></>} left />
      <Dim x1={offX} x2={end} y={G + lines.length * H + 14} color={C2} label={<>Block size<Limit>64 byte</Limit></>} below />

      {/* Set associative: fewer sets than lines, so fewer index bits and a longer tag */}
      <Label x={20} y={296} color="var(--text)">Set Associative</Label>
      <Label x={20} y={312} sub>4-way · Number of sets 64</Label>
      <Cell x={X0} y={284} w={20 * PX} h={40} color={C4} title="Tag" sub="20 bit" />
      <Cell x={bx(20)} y={284} w={6 * PX} h={40} color={C1} title="Set offset" sub="6 bit" />
      <Cell x={offX} y={284} w={6 * PX} h={40} color={C2} title="Word offset" sub="6 bit" />

      {/* Fully associative: a block can sit in any line, so no index at all */}
      <Label x={20} y={362} color="var(--text)">Fully Associative</Label>
      <Label x={20} y={378} sub>যেকোনো line-এ বসে</Label>
      <Cell x={X0} y={350} w={26 * PX} h={40} color={C4} title="Tag" sub="26 bit" />
      <Cell x={offX} y={350} w={6 * PX} h={40} color={C2} title="Offset" sub="6 bit" />
    </svg>
  )
}

export default {
  'os-paging-translate': PagingTranslateDiagram,
  'os-page-table': PageTableDiagram,
  'os-tlb': TlbDiagram,
  'os-hdd': HddDiagram,
  'os-cache-mapping': CacheMappingDiagram,
}
