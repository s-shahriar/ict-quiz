// Diagrams for the Computer Network equation groups. Each one draws the
// physical picture behind a group — where every quantity lives — and leaves the
// formulas themselves out, so it still works as a cue in cover mode.
//
// Colours come from the --eq-* tokens (equation.css) so they follow the theme.

const C1 = 'var(--eq-1)', C2 = 'var(--eq-2)', C3 = 'var(--eq-3)', C4 = 'var(--eq-4)'
const tint = (c, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, var(--surface))`

// Numbered badge centred on (x, y).
function Step({ x, y, n, color }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill={color} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--surface)">{n}</text>
    </g>
  )
}

// Arrowhead with its tip at (x, y), pointing right (dir 1) or left (dir -1).
function Head({ x, y, dir, color }) {
  return <polygon points={`${x},${y} ${x - 9 * dir},${y - 5} ${x - 9 * dir},${y + 5}`} fill={color} />
}

// Horizontal measure from x1 to x2 at height y, with its label above or below.
function Dim({ x1, x2, y, color, label, below }) {
  return (
    <g>
      <line x1={x1} y1={y - 8} x2={x1} y2={y + 8} stroke={color} strokeWidth="1.5" />
      <line x1={x2} y1={y - 8} x2={x2} y2={y + 8} stroke={color} strokeWidth="1.5" />
      <line x1={x1 + 9} y1={y} x2={x2 - 9} y2={y} stroke={color} strokeWidth="1.5" />
      <Head x={x1 + 2} y={y} dir={-1} color={color} />
      <Head x={x2 - 2} y={y} dir={1} color={color} />
      <text x={(x1 + x2) / 2} y={below ? y + 22 : y - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{label}</text>
    </g>
  )
}

// Tinted box with a centred title and an optional second line.
function Cell({ x, y, w, h, color, title, sub }) {
  const cx = x + w / 2, cy = y + h / 2
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="5" fill={tint(color, 20)} stroke={color} strokeWidth="1.5" />
      <text x={cx} y={sub ? cy - 2 : cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{title}</text>
      {sub && <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10.5" fill="var(--text-3)">{sub}</text>}
    </g>
  )
}

// "T" with a subscript, for use as the last thing inside an SVG <text>.
const Tsub = ({ s }) => <>T<tspan dy="3" fontSize="9">{s}</tspan></>

// The cap a measured quantity can reach, appended to a Dim label in a quieter tone.
const Limit = ({ children }) => <tspan fontWeight="500" fill="var(--text-3)"> · {children}</tspan>

function TcpPacketDiagram() {
  return (
    <svg viewBox="0 0 640 224" role="img" aria-label="TCP packet-এর ভেতরের ভাগ এবং data-র segment">
      <Dim x1={40} x2={600} y={30} color="var(--text-2)" label={<>Total packet<Limit>সর্বোচ্চ হলে MTU</Limit></>} />
      <Cell x={40} y={46} w={120} h={44} color={C1} title="IP header" sub="সাধারণত 20 byte" />
      <Cell x={160} y={46} w={120} h={44} color={C4} title="TCP header" sub="সাধারণত 20 byte" />
      <Cell x={280} y={46} w={320} h={44} color={C2} title="Data" sub="application-এর আসল data" />
      <Dim x1={40} x2={280} y={108} color="var(--text-3)" label="Header (overhead)" below />
      <Dim x1={280} x2={600} y={108} color={C2} label={<>Useful data<Limit>সর্বোচ্চ হলে MSS</Limit></>} below />

      <text x="40" y="164" fontSize="11.5" fontWeight="600" fill="var(--text-2)">Total data, MSS মাপের টুকরায় ভাগ হয়</text>
      {[0, 1, 2].map(i => (
        <Cell key={i} x={40 + i * 150} y={174} w={150} h={40} color={C2} title={`Segment ${i + 1}`} sub="MSS" />
      ))}
      <Cell x={490} y={174} w={90} h={40} color={C3} title="Segment 4" sub="বাকি অংশ" />
    </svg>
  )
}

function UdpPacketDiagram() {
  return (
    <svg viewBox="0 0 640 142" role="img" aria-label="IP packet-এর ভেতরে UDP datagram">
      <Dim x1={40} x2={600} y={30} color="var(--text-2)" label="Total IP packet" />
      <Cell x={40} y={46} w={140} h={44} color={C1} title="IP header" />
      <Cell x={180} y={46} w={130} h={44} color={C4} title="UDP header" sub="8 byte" />
      <Cell x={310} y={46} w={290} h={44} color={C2} title="UDP data" />
      <Dim x1={180} x2={600} y={108} color={C4} label="UDP Length" below />
    </svg>
  )
}

function ThroughputDiagram() {
  const packets = ['1', '2', '3', '…', 'W']
  return (
    <svg viewBox="0 0 640 246" role="img" aria-label="এক RTT-তে এক window data, আর window মাপার দুই উপায়">
      {/* The same window measured two ways: as one block of bits (above the
          pipe), or as a count of packets of a known size (below it). */}
      <Dim x1={166} x2={474} y={44} color={C3} label={<>Window size<Limit>bit বা byte-এ মাপলে</Limit></>} />

      <text x="62" y="56" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">Sender</text>
      <rect x="20" y="66" width="84" height="56" rx="12" fill="var(--elevated)" stroke="var(--border-md)" />
      <text x="62" y="92" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-2)">File size</text>
      <text x="62" y="108" textAnchor="middle" fontSize="11" fill="var(--text-3)">বা Total size</text>

      <text x="578" y="56" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">Receiver</text>
      <rect x="536" y="66" width="84" height="56" rx="12" fill="var(--elevated)" stroke="var(--border-md)" />
      <text x="578" y="92" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-2)">Throughput</text>
      <text x="578" y="108" textAnchor="middle" fontSize="11" fill="var(--text-3)">পৌঁছানোর হার</text>

      {/* The link as a pipe: its width is the BW, what fits inside is one window */}
      <rect x="104" y="70" width="432" height="48" fill={tint(C1, 8)} stroke={C1} />
      <line x1="126" y1="82" x2="126" y2="106" stroke={C1} strokeWidth="1.5" />
      <polygon points="126,74 121,83 131,83" fill={C1} />
      <polygon points="126,114 121,105 131,105" fill={C1} />
      <text x="135" y="98" fontSize="12" fontWeight="700" fill={C1}>BW</text>

      {packets.map((p, i) => (
        <g key={i}>
          <rect x={166 + i * 64} y="80" width="52" height="28" rx="4" fill={tint(C3, 22)} stroke={C3} strokeWidth="1.5" />
          <text x={192 + i * 64} y="99" textAnchor="middle" fontSize="12" fontWeight="700" fill={C3}>{p}</text>
        </g>
      ))}
      <line x1="484" y1="94" x2="506" y2="94" stroke={C3} strokeWidth="2" />
      <Head x={514} y={94} dir={1} color={C3} />

      <Dim x1={166} x2={218} y={136} color={C3} label="Packet size" below />
      <text x="240" y="140" fontSize="12" fontWeight="700" fill={C3}>
        Window size<Limit>packet সংখ্যায় মাপলে W টি</Limit>
      </text>

      {/* ACK path back to the sender */}
      <polyline points="578,122 578,186 62,186 62,132" fill="none" stroke={C2} strokeWidth="1.5" strokeDasharray="5 4" />
      <polygon points="62,123 57,132 67,132" fill={C2} />
      <text x="320" y="180" textAnchor="middle" fontSize="11.5" fontWeight="600" fill={C2}>ACK ফিরে আসে</text>

      <Dim x1={104} x2={536} y={210} color={C4} label="RTT: data যায়, ACK ফেরে" below />
    </svg>
  )
}

function DelayDiagram() {
  return (
    <svg viewBox="0 0 640 282" role="img" aria-label="এক hop-এ চার ধরনের delay">
      {/* Router A: processing, then the output queue */}
      <text x="108" y="28" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">Router A</text>
      <rect x="20" y="40" width="176" height="92" rx="12" fill="var(--elevated)" stroke="var(--border-md)" />

      <Step x={44} y={60} n={1} color={C1} />
      <text x="60" y="64" fontSize="12" fontWeight="600" fill={C1}>Processing</text>
      <text x="34" y="84" fontSize="11" fill="var(--text-3)">header check, route lookup</text>

      <Step x={44} y={108} n={2} color={C2} />
      <text x="60" y="112" fontSize="12" fontWeight="600" fill={C2}>Queue</text>
      {[118, 138, 158].map(x => (
        <rect key={x} x={x} y="98" width="16" height="20" rx="3" fill={tint(C2, 22)} stroke={C2} />
      ))}

      {/* Link, with the packet being pushed onto it */}
      <line x1="196" y1="108" x2="524" y2="108" stroke="var(--text-3)" strokeWidth="2" />
      <Step x={224} y={58} n={3} color={C3} />
      <text x="240" y="62" fontSize="12" fontWeight="600" fill={C3}>Transmission</text>
      <text x="212" y="82" fontSize="11" fill="var(--text-3)">Link speed হারে bit বের হয়</text>
      <Cell x={212} y={94} w={100} h={28} color={C3} title="Packet size" />
      <line x1="320" y1="108" x2="350" y2="108" stroke={C3} strokeWidth="2" />
      <Head x={358} y={108} dir={1} color={C3} />

      {/* Propagation: the whole length of the link */}
      <line x1="204" y1="160" x2="516" y2="160" stroke={C4} strokeWidth="1.5" />
      <Head x={198} y={160} dir={-1} color={C4} />
      <Head x={522} y={160} dir={1} color={C4} />
      <line x1="196" y1="150" x2="196" y2="170" stroke={C4} strokeWidth="1.5" />
      <line x1="524" y1="150" x2="524" y2="170" stroke={C4} strokeWidth="1.5" />
      <Step x={304} y={192} n={4} color={C4} />
      <text x="320" y="196" fontSize="12" fontWeight="600" fill={C4}>Propagation</text>
      <text x="360" y="218" textAnchor="middle" fontSize="11" fill="var(--text-3)">Distance, Propagation speed</text>

      {/* RTT: the same link, there and back */}
      <line x1="206" y1="246" x2="524" y2="246" stroke={C1} strokeWidth="1.5" strokeDasharray="5 4" />
      <Head x={198} y={246} dir={-1} color={C1} />
      <text x="360" y="270" textAnchor="middle" fontSize="12" fontWeight="700" fill={C1}>
        RTT<Limit>এই পথে যাওয়া আর ফিরে আসা</Limit>
      </text>

      {/* Router B */}
      <text x="570" y="28" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">Router B</text>
      <rect x="524" y="40" width="92" height="92" rx="12" fill="var(--elevated)" stroke="var(--border-md)" />
      <text x="570" y="90" textAnchor="middle" fontSize="11" fill="var(--text-3)">পরের hop</text>
    </svg>
  )
}

// Drawn for a = 2, so one cycle (Tt + 2·Tp) is exactly five Tt-wide slots.
function ArqDiagram() {
  const SLOT = 112
  return (
    <svg viewBox="0 0 640 232" role="img" aria-label="Stop-and-Wait এবং Go-Back-N-এর এক cycle">
      <text x="40" y="18" fontSize="11.5" fontWeight="600" fill="var(--text-2)">Stop-and-Wait: এক frame-এর পুরো cycle</text>
      <Cell x={40} y={28} w={SLOT} h={40} color={C3} title={<Tsub s="t" />} sub="frame পাঠানো" />
      <Cell x={40 + SLOT} y={28} w={SLOT * 2} h={40} color={C1} title={<Tsub s="p" />} sub="frame যাচ্ছে" />
      <Cell x={40 + SLOT * 3} y={28} w={SLOT * 2} h={40} color={C1} title={<Tsub s="p" />} sub="ACK ফিরছে" />
      <text x={40 + SLOT / 2} y="90" textAnchor="middle" fontSize="11" fontWeight="600" fill={C3}>কাজের সময়</text>
      <Dim x1={40 + SLOT} x2={600} y={86} color={C1} label="RTT" below />

      <text x="40" y="138" fontSize="11.5" fontWeight="600" fill="var(--text-2)">Go-Back-N: একই cycle-এ Window size টি frame (এখানে 3)</text>
      {[0, 1, 2].map(i => (
        <Cell key={i} x={40 + i * SLOT} y={148} w={SLOT} h={36} color={C2} title={`Frame ${i + 1}`} />
      ))}
      {[3, 4].map(i => (
        <g key={i}>
          <rect x={40 + i * SLOT} y="148" width={SLOT} height="36" rx="5" fill="none" stroke="var(--text-3)" strokeDasharray="5 4" />
          <text x={40 + i * SLOT + SLOT / 2} y="170" textAnchor="middle" fontSize="11" fill="var(--text-3)">ফাঁকা slot</text>
        </g>
      ))}
      <Dim x1={40} x2={40 + SLOT * 3} y={200} color={C2} label="Window size" below />
      <text x={40 + SLOT * 4} y="206" textAnchor="middle" fontSize="11" fill="var(--text-3)">link অলস</text>
    </svg>
  )
}

export default {
  'cn-tcp-packet': TcpPacketDiagram,
  'cn-throughput': ThroughputDiagram,
  'cn-delay': DelayDiagram,
  'cn-arq': ArqDiagram,
  'cn-udp-packet': UdpPacketDiagram,
}
