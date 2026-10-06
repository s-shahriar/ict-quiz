// Computer Network equations. A group is one family of formulas that share a
// diagram; `diagram` is a key in components/equation/diagrams.
//
// Equation shape: { name, lhs, rhs, rel?, note? } — `lhs`/`rhs` are KaTeX
// strings. In cover mode the name and LHS stay visible as the recall cue and
// the RHS + note are hidden. `rel` defaults to '=' (use '\\ge', '\\approx', …).

const r = String.raw

export default {
  category: 'computer_network',
  groups: [
    {
      id: 'tcp-packet',
      title: 'TCP Packet Size',
      sub: 'MSS · Total packet · Segments · Efficiency',
      diagram: 'cn-tcp-packet',
      caption: 'উপরে একটি packet-এর ভেতরের ভাগ; নিচে পুরো data কীভাবে segment-এ ভাগ হয়।',
      symbols: [
        [r`\text{MTU}`, 'link-এর এক frame-এ সর্বোচ্চ যত বড় IP packet যায় (Ethernet-এ 1500 byte)'],
        [r`\text{MSS}`, 'এক segment-এ সর্বোচ্চ যত byte data যায়'],
        [r`\text{Useful data}`, 'packet-এর Data অংশ, অর্থাৎ দুই header বাদে যা থাকে'],
      ],
      equations: [
        {
          name: 'Maximum Segment Size',
          lhs: r`\text{MSS}`,
          rhs: r`\text{MTU} - \text{IP header} - \text{TCP header}`,
          note: 'MTU-র ভেতর থেকে দুই header-এর জায়গা বাদ দিলে data-র জন্য যা থাকে।',
        },
        {
          name: 'Number of TCP segments',
          lhs: r`\text{Segments}`,
          rhs: r`\left\lceil \dfrac{\text{Total data}}{\text{MSS}} \right\rceil`,
          note: 'ভাগফল ভগ্নাংশ হলে উপরের পূর্ণসংখ্যা নিতে হয়, কারণ শেষের ছোট টুকরাটিও একটি segment।',
        },
        {
          name: 'Total packet size',
          lhs: r`\text{Total packet}`,
          rhs: r`\text{Data} + \text{IP header} + \text{TCP header}`,
          note: 'link-এ আসলে যত byte যায় — data আর তার দুই header।',
        },
        {
          name: 'TCP efficiency',
          lhs: r`\eta`,
          rhs: r`\dfrac{\text{Useful data}}{\text{Total packet}} \times 100\%`,
          note: 'পুরো packet-এর কত অংশ আসল data; বাকিটা header, অর্থাৎ overhead।',
        },
      ],
      mnemonic: 'MTU থেকে header বাদ দিলে MSS; data-র সাথে header যোগ করলে Total packet।',
    },
    {
      id: 'tcp-throughput',
      title: 'TCP Throughput ও File Transfer',
      sub: 'Window size · RTT · Bandwidth-Delay Product',
      diagram: 'cn-throughput',
      caption: 'Sender এক window data পাঠায়, তার ACK ফিরে আসতে এক RTT লাগে। একই window দুইভাবে মাপা যায়: মোট bit-এ, অথবা packet গুনে।',
      symbols: [
        [r`\text{RTT}`, 'Round Trip Time — data যাওয়া আর ACK ফিরে আসার মোট সময়'],
        [r`\text{BW}`, 'link-এর Bandwidth (bps)'],
      ],
      equations: [
        {
          name: 'TCP throughput',
          lhs: r`\text{Throughput}`,
          rhs: r`\dfrac{\text{Window size}}{\text{RTT}}`,
          note: 'প্রশ্নে Window size সরাসরি bit বা byte-এ দেওয়া থাকলে। যেমন Window size 64000 bit, RTT 0.1 s হলে 64000 / 0.1 = 640000 bps।',
        },
        {
          name: 'Throughput (Window size packet সংখ্যায়)',
          lhs: r`\text{Throughput}`,
          rhs: r`\dfrac{\text{Window size} \times \text{Packet size}}{\text{RTT}}`,
          note: 'প্রশ্নে Window size packet সংখ্যায় দেওয়া থাকলে। যেমন 8 packet, প্রতিটি 8000 bit হলে window আসলে 8 × 8000 = 64000 bit, তাই উত্তর একই 640000 bps।',
        },
        {
          name: 'Minimum file transfer time',
          lhs: r`\text{Time}`,
          rhs: r`\dfrac{\text{File size}}{\text{Throughput}}`,
          note: 'মোট data-কে প্রতি সেকেন্ডে পৌঁছানো data দিয়ে ভাগ।',
        },
        {
          name: 'File transmission time',
          lhs: r`\text{Time}`,
          rhs: r`\dfrac{\text{Total size}}{\text{BW}}`,
          note: 'Throughput-এর জায়গায় link-এর পুরো BW বসালে একই সূত্র।',
        },
        {
          name: 'Bandwidth-Delay Product',
          lhs: r`\text{BDP}`,
          rhs: r`\text{TCP Window size} = \text{RTT} \times \text{BW}`,
          note: 'এক RTT-তে link যত bit ধরে রাখতে পারে, Window size ততটাই লাগে; BW-এর জায়গায় Throughput দেওয়া থাকলে সেটি দিয়েই RTT-কে গুণ করা যায়।',
        },
      ],
      mnemonic: 'Throughput মানে এক RTT-তে কত data; সময় মানে মোট data ভাগ Throughput।',
    },
    {
      id: 'delay',
      title: 'Delay',
      sub: 'Processing · Queueing · Transmission · Propagation',
      diagram: 'cn-delay',
      caption: 'একটি packet-এর এক hop (Router A থেকে Router B) — চারটি delay কোথায় ঘটে।',
      symbols: [
        [r`\text{Packet size}`, 'bit'],
        [r`\text{Link speed}`, 'bps'],
        [r`\text{Distance}`, 'm'],
        [r`\text{Propagation speed}`, 'm/s'],
      ],
      equations: [
        {
          name: 'Transmission delay',
          lhs: 'T_t',
          rhs: r`\dfrac{\text{Packet size}}{\text{Link speed}}`,
          note: 'packet-এর সব bit link-এ ঠেলে দিতে যে সময় লাগে।',
        },
        {
          name: 'Propagation delay',
          lhs: 'T_p',
          rhs: r`\dfrac{\text{Distance}}{\text{Propagation speed}}`,
          note: 'একটি bit link-এর এক প্রান্ত থেকে অন্য প্রান্তে পৌঁছাতে যে সময় লাগে।',
        },
        {
          name: 'Propagation delay (RTT থেকে)',
          lhs: 'T_p',
          rhs: r`\dfrac{\text{RTT}}{2}`,
          note: 'RTT-তে যাওয়া আর আসা দুটোই ধরা থাকে, তাই এক দিকের জন্য অর্ধেক।',
        },
        {
          name: 'Total nodal delay',
          lhs: r`T_{nodal}`,
          rhs: r`T_{proc} + T_q + T_t + T_p`,
          note: 'এক hop-এর মোট delay — diagram-এর ১ থেকে ৪ যোগ করলেই পাওয়া যায়।',
        },
      ],
      mnemonic: 'Transmission নির্ভর করে packet কত বড় তার উপর; Propagation নির্ভর করে রাস্তা কত লম্বা তার উপর।',
    },
    {
      id: 'arq',
      title: 'ARQ Efficiency',
      sub: 'Stop-and-Wait · Go-Back-N',
      diagram: 'cn-arq',
      caption: 'উপরের cycle-টিকে Transmission delay মাপের slot-এ ভাগ করলে নিচের ছবি পাওয়া যায়।',
      symbols: [
        ['T_t', 'Transmission delay (Transmission time)'],
        ['T_p', 'Propagation delay'],
      ],
      equations: [
        {
          name: 'Ratio a',
          lhs: 'a',
          rhs: r`\dfrac{\text{Propagation delay}}{\text{Transmission delay}}`,
          note: 'একটি frame পাঠানোর সময়ের তুলনায় link কত লম্বা।',
        },
        {
          name: 'Stop-and-Wait efficiency',
          lhs: r`\eta`,
          rhs: r`\dfrac{\text{Transmission time}}{\text{Transmission time} + \text{RTT}} \times 100\%`,
          note: 'পুরো cycle-এর মধ্যে শুধু frame পাঠানোর সময়টুকুই কাজের; RTT = 2 × Propagation delay বসালে 1 / (1 + 2a)।',
        },
        {
          name: 'Go-Back-N efficiency',
          lhs: r`\eta`,
          rhs: r`\dfrac{\text{Window size}}{1 + 2a} \times 100\%`,
          note: 'এক cycle-এ 1 + 2a টি frame-এর জায়গা আছে, তার মধ্যে Window size টি ব্যবহার হয়; Window size এখানে frame সংখ্যায়।',
        },
        {
          name: '100% efficiency-র শর্ত',
          lhs: r`\text{Window size (frame)}`,
          rel: r`\ge`,
          rhs: '1 + 2a',
          note: 'Window size এখানে frame সংখ্যায়; এর চেয়ে ছোট হলে cycle-এর কিছু slot ফাঁকা থাকে, অর্থাৎ link অলস বসে থাকে।',
        },
      ],
      mnemonic: 'Efficiency মানে পুরো cycle-এর কত অংশে frame যাচ্ছে।',
    },
    {
      id: 'udp',
      title: 'UDP Datagram Size',
      sub: 'UDP Length · Total IP packet',
      diagram: 'cn-udp-packet',
      caption: 'UDP datagram-টি একটি IP packet-এর ভেতরে বসে।',
      equations: [
        {
          name: 'UDP Length (datagram size)',
          lhs: r`\text{UDP Length}`,
          rhs: r`\text{UDP header} + \text{UDP data}`,
          note: 'UDP header সবসময় 8 byte; header-এর Length field-এ এই মানটিই লেখা থাকে।',
        },
        {
          name: 'Total IP packet size',
          lhs: r`\text{Total IP packet}`,
          rhs: r`\text{IP header} + \text{UDP header} + \text{Data}`,
          note: 'UDP datagram-এর বাইরে আরও একটি IP header যোগ হয়।',
        },
      ],
      mnemonic: 'UDP Length-এ IP header ধরা হয় না; Total IP packet-এ ধরা হয়।',
    },
  ],
}
