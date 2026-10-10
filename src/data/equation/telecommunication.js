// Telecommunication equations. A group is one family of formulas that share a
// diagram; `diagram` is a key in components/equation/diagrams.
//
// Equation shape: { name, lhs, rhs, rel?, note? } — `lhs`/`rhs` are KaTeX
// strings. In cover mode the name and LHS stay visible as the recall cue and
// the RHS + note are hidden. `rel` defaults to '=' (use '\\ge', '\\approx', …).

const r = String.raw

export default {
  category: 'telecommunication',
  groups: [
    {
      id: 'power-snr',
      title: 'Power, dB ও SNR',
      sub: 'Gain in dB · SNR ratio · SNR in dB · dB থেকে ratio',
      diagram: 'tc-power-snr',
      caption: 'বাঁয়ে power কতগুণ বাড়ল তা dB-তে; ডানে একই dB মাপকাঠিতে signal আর noise — দুইয়ের ফাঁকটাই SNR।',
      symbols: [
        [r`P_{in}`, 'যত power পাঠানো হলো, watt-এ'],
        [r`P_{out}`, 'যত power বেরিয়ে এল, watt-এ'],
        [r`P_{signal}`, 'receiver-এ পাওয়া আসল signal-এর power'],
        [r`P_{noise}`, 'একই সময়ে ঢুকে পড়া noise-এর power'],
        [r`\text{SNR}`, 'Signal-to-Noise Ratio — signal power আর noise power-এর অনুপাত, একটি সংখ্যা (unit নেই)'],
        [r`\text{dB}`, 'decibel — অনুপাতকে log scale-এ মাপার একক'],
      ],
      equations: [
        {
          name: 'Power gain in dB',
          lhs: r`\text{dB}`,
          rhs: r`10 \log_{10} \dfrac{P_{out}\,(\text{W})}{P_{in}\,(\text{W})}`,
          note: 'দুই power-এর অনুপাতকে log scale-এ আনা হয়; 1 mW থেকে 100 mW হলে অনুপাত 100, তাই gain 20 dB।',
        },
        {
          name: 'SNR (ratio)',
          lhs: r`\text{SNR}`,
          rhs: r`\dfrac{P_{signal}\,(\text{W})}{P_{noise}\,(\text{W})}`,
          note: 'দুই power-ই watt-এ, তাই ভাগ করলে unit কেটে যায় — SNR একটি খালি সংখ্যা।',
        },
        {
          name: 'SNR in dB (দুই power dB-তে দেওয়া থাকলে)',
          lhs: r`\text{SNR}_{dB}`,
          rhs: r`P_{signal}\,(\text{dB}) - P_{noise}\,(\text{dB})`,
          note: 'log scale-এ ভাগ মানে বিয়োগ; 30 dB signal আর 5 dB noise হলে SNR 25 dB।',
        },
        {
          name: 'SNR in dB (ratio দেওয়া থাকলে)',
          lhs: r`\text{SNR}_{dB}`,
          rhs: r`10 \log_{10} (\text{SNR})`,
          note: 'ratio-কে dB-তে নেওয়ার সূত্র; SNR ≈ 316 হলে 10 log₁₀316 = 25 dB — উপরের লাইনের মতোই উত্তর।',
        },
        {
          name: 'dB থেকে SNR ফেরত',
          lhs: r`\text{SNR}`,
          rhs: r`10^{\frac{\text{SNR}_{dB}}{10}}`,
          note: 'Shannon capacity-তে SNR লাগে ratio হিসেবে, কিন্তু প্রশ্নে দেওয়া থাকে dB-তে; 25 dB → 10^2.5 ≈ 316.23।',
        },
      ],
      mnemonic: 'dB মানে log scale — ওখানে ভাগ হয়ে যায় বিয়োগ, আর ফিরে আসতে 10-এর ঘাত (dB ÷ 10)।',
    },
    {
      id: 'bandwidth',
      title: 'Bandwidth ও সর্বোচ্চ Frequency',
      sub: 'BW = f_H − f_L · যোগ/বিয়োগ · গুণ · Nyquist rate',
      diagram: 'tc-bandwidth',
      caption: 'উপরে frequency অক্ষে component-গুলো; নিচে sin পদ থেকে frequency বের করে সর্বোচ্চটি, তারপর তার দ্বিগুণ Nyquist rate।',
      symbols: [
        ['f_H', 'composite signal-এর সবচেয়ে উঁচু frequency'],
        ['f_L', 'সবচেয়ে নিচু frequency'],
        [r`f_{max}`, 'signal-এ উপস্থিত component-গুলোর মধ্যে সবচেয়ে উঁচু frequency'],
        ['f_s', 'Sampling frequency (Sampling rate)'],
      ],
      equations: [
        {
          name: 'Bandwidth',
          lhs: r`\text{BW}`,
          rhs: r`f_H - f_L`,
          note: 'frequency range দেওয়া থাকলে সবচেয়ে উঁচুটি থেকে সবচেয়ে নিচুটি বাদ; 100, 300, 500, 700, 900 Hz হলে 900 − 100 = 800 Hz।',
        },
        {
          name: 'এক পদের frequency',
          lhs: r`f \ \text{of} \ \sin(k\pi t)`,
          rhs: r`\dfrac{k}{2}\ \text{Hz}`,
          note: 'sin(2πft)-এর সাথে মিলিয়ে k = 2f; তাই sin 800πt → 400 Hz আর sin 400πt → 200 Hz।',
        },
        {
          name: 'যোগ বা বিয়োগে সর্বোচ্চ frequency',
          lhs: r`f_{max}`,
          rhs: r`\max(f_1,\, f_2)`,
          note: 'যোগ-বিয়োগে নতুন কোনো frequency তৈরি হয় না, পদগুলোই পাশাপাশি থাকে; sin 800πt + sin 400πt → 400 Hz।',
        },
        {
          name: 'গুণে সর্বোচ্চ frequency',
          lhs: r`f_{max}`,
          rhs: r`f_1 + f_2`,
          note: 'গুণ করলে component সরে গিয়ে (f₁ − f₂) আর (f₁ + f₂)-তে বসে; sin 800πt × sin 400πt → 200 Hz ও 600 Hz, সর্বোচ্চ 600 Hz।',
        },
        {
          name: 'Nyquist rate',
          lhs: 'f_s',
          rhs: r`2 f_{max}`,
          note: 'হারানো ছাড়া sample করতে সর্বোচ্চ frequency-র দ্বিগুণ লাগে; গুণের উদাহরণে 2 × (400 + 200) = 1200 Hz।',
        },
      ],
      mnemonic: 'যোগ-বিয়োগে সর্বোচ্চটাই সর্বোচ্চ, গুণে যোগফলটাই সর্বোচ্চ — তারপর sample করতে দ্বিগুণ।',
    },
    {
      id: 'bit-rate',
      title: 'Bit Rate ও Channel Capacity',
      sub: 'Nyquist (noiseless) · Shannon (noisy) · Throughput',
      diagram: 'tc-bit-rate',
      caption: 'একই channel দুইভাবে: উপরে noise ছাড়া — level গুনে capacity; নিচে noise সহ — SNR থেকে capacity; শেষে বাস্তবে কতটা পৌঁছাল।',
      symbols: [
        ['C', 'Channel capacity, অর্থাৎ সর্বোচ্চ সম্ভব bit rate (bps)'],
        [r`\text{Bit rate}`, 'প্রতি সেকেন্ডে কত bit (bps); noiseless সীমায় এটিই C'],
        ['L', 'Number of signal levels — একটি signal element কত রকম হতে পারে'],
        ['n', 'এক signal element কত bit বহন করে'],
        ['f_s', 'Sampling frequency (Sampling rate)'],
      ],
      equations: [
        {
          name: 'Nyquist capacity (noiseless)',
          lhs: 'C',
          rhs: r`2\,\text{BW}\,n = 2\,\text{BW} \log_2 L`,
          note: 'noise না থাকলে সীমা শুধু BW আর level-সংখ্যা; BW 3000 Hz, L 4 হলে 2 × 3000 × 2 = 12000 bps।',
        },
        {
          name: 'Bit rate sampling rate দিয়ে',
          lhs: r`\text{Bit rate}`,
          rhs: r`n f_s \quad (\because f_s = 2\,\text{BW})`,
          note: 'প্রতি sample-এ n bit, সেকেন্ডে f_s টি sample; BW 3000 Hz হলে f_s = 6000, তাই 2 × 6000 = 12000 bps — উপরের উত্তরই।',
        },
        {
          name: 'Signalling level',
          lhs: 'L',
          rhs: '2^n',
          note: 'প্রশ্নে signalling level জানতে চাইলে C = 2·BW·log₂L থেকে প্রথমে n বের করে তারপর L; n = 2 হলে L = 4।',
        },
        {
          name: 'Shannon capacity (noisy)',
          lhs: 'C',
          rhs: r`\text{BW} \log_2 (1 + \text{SNR})`,
          note: 'noise থাকলে level গোনা যায় না, সীমা ঠিক করে SNR; BW 3000 Hz, SNR 3 হলে 3000 × 2 = 6000 bps।',
        },
        {
          name: 'Throughput',
          lhs: r`\text{Throughput}`,
          rhs: r`\dfrac{\text{Total transmitted frame (bit)}}{\text{Time (second)}}`,
          note: 'Capacity হলো সর্বোচ্চ সম্ভব, Throughput হলো বাস্তবে যতটা গেল; 1 মিনিটে মাপলে হরে 60 বসে।',
        },
      ],
      mnemonic: 'Noiseless হলে level গোনো (Nyquist), noisy হলে SNR দেখো (Shannon); বাস্তবে যা পেলে তা Throughput।',
    },
    {
      id: 'baud-modulation',
      title: 'Baud Rate ও Modulation Bandwidth',
      sub: 'S = R_b / n · ASK/PSK · FSK · Carrier frequency',
      diagram: 'tc-baud',
      caption: 'উপরে bit-গুলো n টি করে ভাগ হয়ে signal element হয়; নিচে সেই element-গুলো band-এর কতটা জায়গা নেয় আর carrier কোথায় বসে।',
      symbols: [
        ['S', 'Baud rate বা Signalling rate — প্রতি সেকেন্ডে কতটি signal element (baud)'],
        ['R_b', 'Bit rate (bps); noiseless সীমায় R_b = C'],
        ['n', 'এক signal element কত bit বহন করে, n = log₂L'],
        ['d', 'Modulation factor — 0 থেকে 1, কত ছড়ানো modulation'],
        [r`\Delta f`, 'FSK-তে carrier-দুটি মাঝখান থেকে যত দূরে সরে'],
        ['f_c', 'Carrier frequency — band-এর মাঝখানের frequency'],
      ],
      equations: [
        {
          name: 'n কত, কোন scheme-এ',
          lhs: 'n',
          rhs: r`\log_2 L`,
          note: 'নামের সংখ্যাটাই L: 16-PSK → n = 4, 64-QAM → n = 6, 8-PSK → n = 3, 8-QAM → n = 3।',
        },
        {
          name: 'Baud rate',
          lhs: 'S',
          rhs: r`\dfrac{C}{n} = \dfrac{R_b}{n}\ \text{baud}`,
          note: 'n টি bit একসাথে এক element-এ যায়, তাই element-সংখ্যা bit-সংখ্যার n ভাগের এক; 100 kbps, n = 2 হলে 50 kbaud।',
        },
        {
          name: 'ASK / PSK bandwidth',
          lhs: r`\text{BW}`,
          rhs: r`(1+d)S = (1+d)\dfrac{R_b}{n}`,
          note: 'এক element যত জায়গা নেয় তা S, আর d তাকে ছড়ায়; S 50 kbaud, d = 1 হলে BW 100 kHz।',
        },
        {
          name: 'FSK bandwidth',
          lhs: r`\text{BW}`,
          rhs: r`(1+d)S + 2\Delta f`,
          note: 'FSK-তে দুটি আলাদা carrier লাগে, তাই ASK-এর জায়গার সাথে তাদের দূরত্ব 2Δf যোগ হয়।',
        },
        {
          name: 'Carrier frequency',
          lhs: 'f_c',
          rhs: r`\dfrac{f_H + f_L}{2}`,
          note: 'carrier বসে band-এর ঠিক মাঝখানে; band 200 থেকে 300 kHz হলে f_c = 250 kHz।',
        },
        {
          name: 'Band দেওয়া থাকলে baud rate',
          lhs: 'S',
          rhs: r`\dfrac{\text{BW}}{1+d}\ \text{baud}`,
          note: 'ASK/PSK-এর সূত্র উল্টে লেখা; band 200–300 kHz মানে BW 100 kHz, d = 1 ধরলে S = 100 / 2 = 50 kbaud।',
        },
      ],
      mnemonic: 'n টি bit মিলে এক element — তাই baud সবসময় bit rate-এর n ভাগের এক, আর BW চলে baud-এর তালে।',
    },
    {
      id: 'sampling-pcm',
      title: 'Sampling, Frame Duration ও PCM',
      sub: 'Nyquist rate · একসাথে sampling · Frame duration · Quantization SNR',
      diagram: 'tc-pcm',
      caption: 'analog wave নির্দিষ্ট দূরত্ব পরপর sample হয়, প্রতিটি sample n bit-এর একটি frame হয় — এক frame-এর সময়টুকুই Frame duration।',
      symbols: [
        ['f_s', 'Sampling frequency বা Sampling rate (Hz) — সেকেন্ডে কতটি sample'],
        ['n', 'এক sample কত bit-এ quantize হলো (bits per sample)'],
        [r`\text{Frame}`, 'এক sample-এর n bit মিলে যে ছোট প্যাকেট'],
        [r`\text{SNR}_{dB}`, 'Quantization-এর পরে signal আর quantization noise-এর অনুপাত, dB-তে'],
      ],
      equations: [
        {
          name: 'Nyquist Rate',
          lhs: r`\text{Nyquist Rate}`,
          rhs: r`\text{Sampling frequency} = 2\,\text{BW}`,
          note: 'Nyquist rate আর sampling frequency একই জিনিসের দুই নাম — signal-এর BW-র দ্বিগুণ।',
        },
        {
          name: 'একাধিক source একসাথে sample হলে',
          lhs: 'f_s',
          rhs: r`2\,(\text{BW}_1 + \text{BW}_2)`,
          note: 'একসাথে sample করলে প্রতিটির নিজের হার যোগ হয়; 500 kHz আর 200 kHz হলে BW 700 kHz, তাই f_s = 2 × 700 = 1400 kHz।',
        },
        {
          name: 'Frame duration',
          lhs: r`\text{Frame duration}`,
          rhs: r`\dfrac{1}{\text{Sampling rate (Hz)}}`,
          note: 'সেকেন্ডে f_s টি frame হলে একটির ভাগে পড়ে 1/f_s সেকেন্ড; f_s = 1400 kHz হলে ≈ 0.714 µs।',
        },
        {
          name: 'Quantization SNR',
          lhs: r`\text{SNR}_{dB}`,
          rhs: r`1.76 + 6.02\,n`,
          note: 'প্রতি বাড়তি bit প্রায় 6 dB যোগ করে; 48 dB চাইলে n = (48 − 1.76) / 6.02 ≈ 7.68, উপরের পূর্ণসংখ্যা নিয়ে n = 8 bit।',
        },
        {
          name: 'PCM bit rate',
          lhs: r`\text{Bit rate}`,
          rhs: r`n f_s`,
          note: 'SNR থেকে পাওয়া n-কে sampling rate দিয়ে গুণ; 8 × 1400 kHz = 11200 kbps।',
        },
      ],
      mnemonic: 'আগে f_s (BW-র দ্বিগুণ), তারপর n (SNR থেকে), শেষে গুণ — ওটাই PCM-এর bit rate।',
    },
  ],
}
