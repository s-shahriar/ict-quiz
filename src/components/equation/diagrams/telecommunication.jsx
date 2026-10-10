// Diagrams for the Telecommunication equation groups. Each one draws the
// physical picture behind a group — where every quantity lives — and leaves the
// formulas themselves out, so it still works as a cue in cover mode.

import { C1, C2, C3, C4, Cell, Dim, Head, Limit, VDim, Arrow, tint } from './parts.jsx'

// A sine curve as a polyline, so the wave can carry sample ticks on it.
function wavePoints({ x1, x2, y, amp, cycles, steps = 160 }) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push(`${(x1 + (x2 - x1) * t).toFixed(1)},${(y - amp * Math.sin(2 * Math.PI * cycles * t)).toFixed(1)}`)
  }
  return pts.join(' ')
}

// One amplifier chain for the gain, and one dB ruler where signal and noise
// stand side by side — the gap between them is what SNR measures.
function PowerSnrDiagram() {
  const zero = 286, perDb = 104 / 35          // 0 dB at y=286, 35 dB at y=182
  const dbY = (db) => zero - db * perDb
  return (
    <svg viewBox="0 0 640 310" role="img" aria-label="Power gain-এর চেইন এবং dB মাপকাঠিতে signal ও noise">
      <text x="20" y="20" fontSize="11.5" fontWeight="600" fill="var(--text-2)">Channel / Amplifier: power কতগুণ বাড়ল</text>
      <Cell x={20} y={36} w={124} h={48} color={C1} title="P_in (W)" sub="এখানে 1 mW" />
      <Arrow pts={[[144, 60], [188, 60]]} color={C3} />
      <Cell x={192} y={36} w={124} h={48} color={C3} title="Gain" sub="dB-তে মাপা হয়" />
      <Arrow pts={[[316, 60], [360, 60]]} color={C3} />
      <Cell x={364} y={36} w={124} h={48} color={C1} title="P_out (W)" sub="এখানে 100 mW" />
      <Dim x1={20} x2={488} y={104} color="var(--text-3)" label="দুইয়ের অনুপাত এখানে 100 গুণ" below />

      <text x="20" y="156" fontSize="11.5" fontWeight="600" fill="var(--text-2)">Receiver-এ একই সময়ে: signal আর noise</text>

      {/* dB ruler */}
      <line x1={70} y1={178} x2={70} y2={zero} stroke="var(--text-3)" strokeWidth="1.5" />
      {[0, 10, 20, 30].map(db => (
        <g key={db}>
          <line x1={64} y1={dbY(db)} x2={70} y2={dbY(db)} stroke="var(--text-3)" strokeWidth="1.5" />
          <text x="58" y={dbY(db) + 4} textAnchor="end" fontSize="11" fill="var(--text-3)">{db}</text>
        </g>
      ))}
      <text x="58" y="176" textAnchor="end" fontSize="11" fontWeight="700" fill="var(--text-3)">dB</text>

      <rect x={88} y={dbY(30)} width={112} height={zero - dbY(30)} rx="4" fill={tint(C2, 22)} stroke={C2} strokeWidth="1.5" />
      <text x="144" y={dbY(30) - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill={C2}>P_signal (dB) · 30</text>

      <rect x={214} y={dbY(5)} width={112} height={zero - dbY(5)} rx="4" fill={tint(C4, 22)} stroke={C4} strokeWidth="1.5" />
      <text x="270" y={dbY(5) - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill={C4}>P_noise (dB) · 5</text>

      <VDim x={356} y1={dbY(30)} y2={dbY(5)} color={C3} label="SNR (dB) · এখানে 25" />

      {/* The same two powers in watt — their ratio is SNR as a plain number. */}
      <Cell x={476} y={186} w={148} h={40} color={C2} title="P_signal (W)" />
      <Cell x={476} y={236} w={148} h={40} color={C4} title="P_noise (W)" />
      <text x="550" y="300" textAnchor="middle" fontSize="11.5" fontWeight="600" fill={C3}>অনুপাত এখানে ≈ 316</text>
    </svg>
  )
}

// Three frequency axes: the component list, then what +/− and × do to the
// highest component, and how far the Nyquist rate sits beyond it.
function BandwidthDiagram() {
  const axisA = (f) => 40 + f * 0.54          // 0 Hz at x=40, ~1000 Hz at x=580
  const axisB = (f) => 40 + f * 0.6           // row B: 0 at 40, 700 Hz at 460
  const axisC = (f) => 40 + f * 0.4308        // row C: 0 at 40, 1300 Hz at 600
  return (
    <svg viewBox="0 0 640 380" role="img" aria-label="Frequency অক্ষে bandwidth এবং সর্বোচ্চ frequency">
      {/* Row A — a composite signal's components, and the span they cover */}
      <text x="20" y="18" fontSize="11.5" fontWeight="600" fill="var(--text-2)">Composite signal-এর component-গুলো</text>
      <Dim x1={axisA(100)} x2={axisA(900)} y={44} color={C3} label="BW · এখানে 800 Hz" />
      {[100, 300, 500, 700, 900].map(f => (
        <line key={f} x1={axisA(f)} y1={56} x2={axisA(f)} y2={90} stroke={C1} strokeWidth="2.5" />
      ))}
      <line x1={40} y1={90} x2={596} y2={90} stroke="var(--text-3)" strokeWidth="1.5" />
      <Head x={604} y={90} dir={1} color="var(--text-3)" />
      {[[100, '100 · f_L'], [300, '300'], [500, '500'], [700, '700'], [900, '900 · f_H']].map(([f, lab]) => (
        <text key={f} x={axisA(f)} y={106} textAnchor="middle" fontSize="11" fill="var(--text-3)">{lab}</text>
      ))}
      <text x="616" y="106" textAnchor="end" fontSize="11" fill="var(--text-3)">Hz</text>

      {/* Row B — sin 800πt + sin 400πt: both terms stay where they are */}
      <text x="20" y="146" fontSize="11.5" fontWeight="600" fill="var(--text-2)">
        যোগ / বিয়োগ: sin 800πt ± sin 400πt — পদ দুটোই নিজের জায়গায়
      </text>
      <Dim x1={40} x2={axisB(400)} y={176} color={C2} label="f_max" />
      {[200, 400].map(f => (
        <line key={f} x1={axisB(f)} y1={186} x2={axisB(f)} y2={224} stroke={C1} strokeWidth="2.5" />
      ))}
      <line x1={40} y1={224} x2={596} y2={224} stroke="var(--text-3)" strokeWidth="1.5" />
      <Head x={604} y={224} dir={1} color="var(--text-3)" />
      {[[200, '200 Hz'], [400, '400 Hz']].map(([f, lab]) => (
        <text key={f} x={axisB(f)} y={240} textAnchor="middle" fontSize="11" fill="var(--text-3)">{lab}</text>
      ))}

      {/* Row C — sin 800πt × sin 400πt: the components move to f₁∓f₂ */}
      <text x="20" y="266" fontSize="11.5" fontWeight="600" fill="var(--text-2)">
        গুণ: sin 800πt × sin 400πt — component সরে যায়
      </text>
      <Dim x1={40} x2={axisC(1200)} y={296} color={C3} label={<>f_s<Limit>Nyquist rate</Limit></>} />
      <Dim x1={40} x2={axisC(600)} y={320} color={C2} label="f_max" />
      {[200, 600].map(f => (
        <line key={f} x1={axisC(f)} y1={330} x2={axisC(f)} y2={354} stroke={C1} strokeWidth="2.5" />
      ))}
      <line x1={axisC(1200)} y1={334} x2={axisC(1200)} y2={354} stroke={C3} strokeWidth="2" strokeDasharray="4 3" />
      <line x1={40} y1={354} x2={596} y2={354} stroke="var(--text-3)" strokeWidth="1.5" />
      <Head x={604} y={354} dir={1} color="var(--text-3)" />
      {[[200, '200 Hz'], [600, '600 Hz']].map(([f, lab]) => (
        <text key={f} x={axisC(f)} y={370} textAnchor="middle" fontSize="11" fill="var(--text-3)">{lab}</text>
      ))}
      <text x={axisC(1200)} y={370} textAnchor="middle" fontSize="11" fontWeight="700" fill={C3}>1200 Hz</text>
    </svg>
  )
}

// One channel seen twice — fed by countable levels (noiseless) and by a
// signal buried in noise (noisy) — and what actually comes out at the far end.
function BitRateDiagram() {
  return (
    <svg viewBox="0 0 640 336" role="img" aria-label="Noiseless ও noisy channel-এর capacity, আর বাস্তব throughput">
      {/* Noiseless input: L levels, n bits each */}
      <text x="16" y="24" fontSize="11.5" fontWeight="600" fill="var(--text-2)">Noiseless: L টি level</text>
      {['11', '10', '01', '00'].map((b, i) => (
        <Cell key={b} x={16} y={34 + i * 26} w={78} h={22} color={C2} title={b} />
      ))}
      <VDim x={106} y1={34} y2={138} color={C2} label="L · 4" />
      <text x="16" y="158" fontSize="11" fill="var(--text-3)">n · এখানে 2 bit / element</text>
      <Arrow pts={[[118, 46], [232, 96]]} color={C2} />

      {/* The channel itself: its width is the BW */}
      <rect x={200} y={100} width={248} height={92} rx="8" fill={tint(C1, 8)} stroke={C1} strokeWidth="1.5" />
      <VDim x={182} y1={100} y2={192} color={C1} label="BW" left />
      <text x="324" y="126" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">Channel</text>
      <text x="324" y="148" textAnchor="middle" fontSize="11" fill="var(--text-3)">সেকেন্ডে 2 × BW টি signal element</text>
      <text x="324" y="168" textAnchor="middle" fontSize="11" fill="var(--text-3)">f_s · এখানে 6000 sample/s</text>
      <text x="372" y="88" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={C2}>C · noiseless হলে 12000 bps</text>
      <text x="324" y="212" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={C4}>C · noisy হলে 6000 bps</text>

      {/* Noisy input: two powers, their ratio is all the channel knows */}
      <text x="16" y="248" fontSize="11.5" fontWeight="600" fill="var(--text-2)">Noisy: level নয়, SNR</text>
      <Cell x={16} y={258} w={78} h={30} color={C2} title="P_signal" />
      <Cell x={16} y={292} w={78} h={26} color={C4} title="P_noise" />
      <VDim x={106} y1={258} y2={318} color={C4} label="SNR · 3" />
      <Arrow pts={[[172, 272], [196, 196]]} color={C4} />

      {/* Receiver: what really arrived, over the time it took */}
      <rect x={478} y={100} width={146} height={92} rx="8" fill="var(--elevated)" stroke="var(--border-md)" />
      <text x="551" y="128" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">Receiver</text>
      <text x="551" y="150" textAnchor="middle" fontSize="11" fill="var(--text-3)">Bit rate এখানেই</text>
      <text x="551" y="170" textAnchor="middle" fontSize="11" fill="var(--text-3)">গোনা হয়</text>
      <Arrow pts={[[448, 146], [474, 146]]} color={C1} />

      <text x="462" y="238" textAnchor="end" fontSize="12" fontWeight="700" fill={C3}>Throughput</text>
      <Cell x={478} y={216} w={146} h={34} color={C3} title="Total transmitted" sub="frame (bit)" />
      <line x1={478} y1={258} x2={624} y2={258} stroke={C3} strokeWidth="2" />
      <Cell x={478} y={266} w={146} h={30} color={C3} title="Time (second)" />
      <text x="551" y="318" textAnchor="middle" fontSize="11" fill="var(--text-3)">1 মিনিটে মাপলে হরে 60</text>
    </svg>
  )
}

// Bits packed n at a time into signal elements, and the band those elements
// occupy — with the carrier sitting dead centre.
function BaudDiagram() {
  const bits = ['1', '0', '1', '1', '0', '0', '1', '0']
  const fx = (k) => 40 + (k - 150) * 2.8      // 150 kHz at x=40, 350 kHz at x=600
  return (
    <svg viewBox="0 0 640 344" role="img" aria-label="Bit থেকে signal element, আর band-এ তাদের জায়গা">
      <text x="20" y="18" fontSize="11.5" fontWeight="600" fill="var(--text-2)">bit-গুলো n টি করে ভাগ হয়ে signal element হয়</text>
      {bits.map((b, i) => (
        <Cell key={i} x={20 + i * 34} y={28} w={30} h={26} color={C4} title={b} />
      ))}
      <Dim x1={20} x2={292} y={68} color={C4} label="Bit rate · এখানে 100 kbps" below />

      {[0, 1, 2, 3].map(i => (
        <Cell key={i} x={20 + i * 68} y={96} w={64} h={32} color={C2} title="element" sub="n = 2 bit" />
      ))}
      <Dim x1={20} x2={292} y={142} color={C2} label="Baud rate S · এখানে 50 kbaud" below />
      <text x="312" y="116" fontSize="11" fill="var(--text-3)">n = log₂L · 4-PSK হলে 2, 16-PSK হলে 4,</text>
      <text x="312" y="134" fontSize="11" fill="var(--text-3)">8-PSK ও 8-QAM হলে 3, 64-QAM হলে 6</text>

      <text x="20" y="190" fontSize="11.5" fontWeight="600" fill="var(--text-2)">band-এ সেই element-গুলোর জায়গা আর carrier</text>
      <Dim x1={fx(200)} x2={fx(300)} y={210} color={C3} label="BW · এখানে 100 kHz" />
      <rect x={fx(200)} y={222} width={fx(300) - fx(200)} height={44} rx="5" fill={tint(C3, 16)} stroke={C3} strokeWidth="1.5" />
      <Dim x1={fx(200)} x2={fx(250)} y={244} color={C1} label="S" />
      <text x={fx(300) + 14} y={248} fontSize="11" fill="var(--text-3)">d = 1 এখানে</text>

      {/* The carrier, and the pair FSK splits it into */}
      <line x1={fx(250)} y1={216} x2={fx(250)} y2={276} stroke={C4} strokeWidth="2" />
      {[230, 270].map(k => (
        <line key={k} x1={fx(k)} y1={226} x2={fx(k)} y2={292} stroke={C4} strokeWidth="1.5" strokeDasharray="4 3" />
      ))}
      <line x1={40} y1={276} x2={610} y2={276} stroke="var(--text-3)" strokeWidth="1.5" />
      <text x={fx(200)} y={292} textAnchor="middle" fontSize="11" fill="var(--text-3)">200 · f_L</text>
      <text x={fx(250)} y={292} textAnchor="middle" fontSize="11" fontWeight="700" fill={C4}>250 · f_c</text>
      <text x={fx(300)} y={292} textAnchor="middle" fontSize="11" fill="var(--text-3)">300 · f_H</text>
      <text x="616" y="292" textAnchor="end" fontSize="11" fill="var(--text-3)">kHz</text>
      <Dim x1={fx(230)} x2={fx(270)} y={308} color={C4} label="2Δf · FSK-এ carrier দুটির দূরত্ব" below />
    </svg>
  )
}

// Two sources sampled together, the gap between samples, and each sample
// turned into n bits.
function PcmDiagram() {
  const tick = (i) => 40 + i * 62
  return (
    <svg viewBox="0 0 640 344" role="img" aria-label="দুই source একসাথে sample, frame duration এবং প্রতি sample-এর bit">
      <text x="20" y="18" fontSize="11.5" fontWeight="600" fill="var(--text-2)">দুই source একসাথে: BW যোগ হয়, তারপর তার দ্বিগুণ হারে sample</text>
      <Cell x={20} y={30} w={110} h={28} color={C1} title="BW₁ · 500 kHz" />
      <Cell x={20} y={64} w={110} h={28} color={C1} title="BW₂ · 200 kHz" />
      <Arrow pts={[[130, 44], [160, 56]]} color={C1} />
      <Arrow pts={[[130, 78], [160, 66]]} color={C1} />
      <Cell x={164} y={46} w={120} h={32} color={C3} title="BW · 700 kHz" />
      <Arrow pts={[[284, 62], [312, 62]]} color={C3} />
      <text x={401} y={34} textAnchor="middle" fontSize="11" fill="var(--text-3)">Nyquist rate</text>
      <Cell x={316} y={42} w={170} h={38} color={C2} title="f_s · 1400 kHz" sub="Sampling rate / frequency" />

      <text x="20" y="118" fontSize="11.5" fontWeight="600" fill="var(--text-2)">পরপর দুই sample-এর দূরত্বই Frame duration</text>
      <polyline points={wavePoints({ x1: 40, x2: 598, y: 160, amp: 22, cycles: 2.5 })}
        fill="none" stroke={C1} strokeWidth="1.8" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
        const x = tick(i)
        const y = 160 - 22 * Math.sin(2 * Math.PI * 2.5 * ((x - 40) / 558))
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={192} stroke={C2} strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx={x} cy={y} r="3" fill={C2} />
          </g>
        )
      })}
      <Dim x1={tick(0)} x2={tick(1)} y={204} color={C3} label="Frame duration" below />

      <text x="20" y="252" fontSize="11.5" fontWeight="600" fill="var(--text-2)">প্রতি sample n bit-এ quantize হয়</text>
      <Cell x={20} y={264} w={84} h={30} color={C2} title="1 sample" />
      <Arrow pts={[[104, 279], [136, 279]]} color={C2} />
      <text x="268" y="260" textAnchor="middle" fontSize="11" fill="var(--text-3)">এক Frame</text>
      {['1', '0', '0', '1', '1', '0', '1', '1'].map((b, i) => (
        <Cell key={i} x={140 + i * 32} y={264} w={28} h={30} color={C4} title={b} />
      ))}
      <Dim x1={140} x2={396} y={308} color={C4} label="n · এখানে 8 bit per sample" below />
      <text x="414" y="272" fontSize="11" fill="var(--text-3)">SNR_dB চাইলে 50 dB → n = 8</text>
      <text x="414" y="292" fontSize="11" fontWeight="700" fill={C3}>Bit rate · এখানে 11200 kbps</text>
    </svg>
  )
}

export default {
  'tc-power-snr': PowerSnrDiagram,
  'tc-bandwidth': BandwidthDiagram,
  'tc-bit-rate': BitRateDiagram,
  'tc-baud': BaudDiagram,
  'tc-pcm': PcmDiagram,
}
