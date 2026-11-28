# Phase 6/8 eval: extraction + bill totals, all cases (2026-11-28)

- ⚠️ **Partial: 125 of 208 cases scored so far** (Groq free-tier quota). Re-run `npm run eval:extract` to continue; finished cases are cached.
- Model: `openai/gpt-oss-120b`, reasoning_effort `low`, strict JSON schema; main model only (no fallback while scoring)
- **Field accuracy: 99.3%** (1661/1672 fields) · fully correct cases: 115/125
- **Bill total exact match (Groq → normalizer → matcher → bill): 73/75**
- **Clarifying questions per new bill (before read-back): avg 0.37** over 81 bills
- **Latency (server call): p50 1350 ms · p90 2383 ms** · tokens per request avg 2813
- Target: > 90% field accuracy (phase 6); > 85% per language (phase 8); p50 < 3 s end of speech → read-back

**By language** (Phase 8 target > 85% each):

| Language                  | Scored | Field accuracy | Totals exact | p50     |
| ------------------------- | ------ | -------------- | ------------ | ------- |
| Hinglish (`hi-Latn`)      | 55/125 | 99.3%          | 35/36        | 1459 ms |
| Hindi (Devanagari) (`hi`) | 38/43  | 98.9%          | 17/18        | 1501 ms |
| English (`en-IN`)         | 32/40  | 99.8%          | 21/21        | 1193 ms |

| Case | Lang    | Score | ms    | Misses                                                                                             |
| ---- | ------- | ----- | ----- | -------------------------------------------------------------------------------------------------- |
| u001 | hi-Latn | 16/16 | 1800  | ✓                                                                                                  |
| u002 | hi-Latn | 16/16 | 1567  | ✓                                                                                                  |
| u003 | hi-Latn | 12/12 | 1811  | ✓                                                                                                  |
| u005 | hi-Latn | 16/16 | 4404  | ✓                                                                                                  |
| u006 | hi-Latn | 12/12 | 1280  | ✓                                                                                                  |
| u007 | hi-Latn | 16/16 | 8146  | ✓                                                                                                  |
| u008 | hi-Latn | 16/16 | 1709  | ✓                                                                                                  |
| u009 | hi-Latn | 16/16 | 1874  | ✓                                                                                                  |
| u013 | hi-Latn | 12/12 | 5588  | ✓                                                                                                  |
| u014 | hi-Latn | 8/8   | 894   | ✓                                                                                                  |
| u015 | hi-Latn | 8/8   | 1030  | ✓                                                                                                  |
| u030 | hi-Latn | 8/8   | 2383  | ✓                                                                                                  |
| u031 | hi-Latn | 16/16 | 1233  | ✓                                                                                                  |
| u033 | hi-Latn | 16/16 | 7420  | ✓                                                                                                  |
| u034 | hi-Latn | 16/16 | 1298  | ✓                                                                                                  |
| u035 | hi-Latn | 16/16 | 10410 | ✓                                                                                                  |
| u036 | hi-Latn | 16/16 | 1231  | ✓                                                                                                  |
| u037 | hi-Latn | 15/16 | 468   | item0.unit: null ≠ fan                                                                             |
| u040 | hi-Latn | 12/12 | 6976  | ✓                                                                                                  |
| u041 | hi-Latn | 16/16 | 1303  | ✓                                                                                                  |
| u042 | hi-Latn | 16/16 | 6958  | ✓                                                                                                  |
| u058 | en-IN   | 16/16 | 1988  | ✓                                                                                                  |
| u059 | hi-Latn | 16/16 | 1327  | ✓                                                                                                  |
| u060 | hi-Latn | 20/20 | 1459  | ✓                                                                                                  |
| u061 | hi-Latn | 16/16 | 1521  | ✓                                                                                                  |
| u062 | hi-Latn | 14/16 | 1415  | item0.unit: null ≠ fan; item0.match: rc_fan_regulator ≠ rc_labour_fan_install; TOTAL: ₹750 ≠ ₹1350 |
| u064 | hi-Latn | 16/16 | 1872  | ✓                                                                                                  |
| u065 | hi-Latn | 20/20 | 1595  | ✓                                                                                                  |
| u066 | hi-Latn | 16/16 | 1528  | ✓                                                                                                  |
| u067 | hi-Latn | 16/16 | 1524  | ✓                                                                                                  |
| u068 | hi-Latn | 16/16 | 1521  | ✓                                                                                                  |
| u069 | hi-Latn | 16/16 | 1508  | ✓                                                                                                  |
| u070 | hi-Latn | 16/16 | 1321  | ✓                                                                                                  |
| u072 | hi-Latn | 15/16 | 1260  | item0.unit: null ≠ fan                                                                             |
| u073 | hi-Latn | 20/20 | 1543  | ✓                                                                                                  |
| u074 | hi-Latn | 16/16 | 3208  | ✓                                                                                                  |
| u075 | hi-Latn | 16/16 | 1492  | ✓                                                                                                  |
| u077 | hi      | 16/16 | 3535  | ✓                                                                                                  |
| u078 | hi      | 12/12 | 1061  | ✓                                                                                                  |
| u079 | hi      | 8/8   | 1004  | ✓                                                                                                  |
| u080 | hi      | 8/8   | 1155  | ✓                                                                                                  |
| u081 | en-IN   | 16/16 | 1555  | ✓                                                                                                  |
| u082 | en-IN   | 16/16 | 1551  | ✓                                                                                                  |
| u083 | en-IN   | 12/12 | 2965  | ✓                                                                                                  |
| u084 | en-IN   | 8/8   | 1660  | ✓                                                                                                  |
| u085 | en-IN   | 8/8   | 1221  | ✓                                                                                                  |
| u086 | hi-Latn | 16/16 | 1699  | ✓                                                                                                  |
| u087 | hi-Latn | 12/12 | 1143  | ✓                                                                                                  |
| u088 | hi-Latn | 12/12 | 1187  | ✓                                                                                                  |
| u089 | hi-Latn | 16/16 | 2715  | ✓                                                                                                  |
| u090 | en-IN   | 12/12 | 1224  | ✓                                                                                                  |
| u091 | hi-Latn | 12/12 | 1283  | ✓                                                                                                  |
| u092 | hi-Latn | 12/12 | 1343  | ✓                                                                                                  |
| u093 | hi-Latn | 8/8   | 1308  | ✓                                                                                                  |
| u094 | hi-Latn | 8/8   | 1038  | ✓                                                                                                  |
| u095 | hi-Latn | 12/12 | 1375  | ✓                                                                                                  |
| u096 | hi-Latn | 11/11 | 1389  | ✓                                                                                                  |
| u097 | hi-Latn | 8/8   | 1324  | ✓                                                                                                  |
| u098 | hi-Latn | 7/8   | 1226  | intent: add_info ≠ approve                                                                         |
| u099 | hi-Latn | 16/16 | 1493  | ✓                                                                                                  |
| u100 | hi-Latn | 12/12 | 1207  | ✓                                                                                                  |
| u101 | hi-Latn | 12/12 | 1632  | ✓                                                                                                  |
| u102 | hi-Latn | 8/8   | 1403  | ✓                                                                                                  |
| u103 | hi-Latn | 8/8   | 1015  | ✓                                                                                                  |
| u104 | hi-Latn | 8/8   | 882   | ✓                                                                                                  |
| u105 | hi-Latn | 8/8   | 886   | ✓                                                                                                  |
| u106 | hi      | 16/16 | 1573  | ✓                                                                                                  |
| u107 | hi      | 16/16 | 2262  | ✓                                                                                                  |
| u109 | hi      | 20/20 | 1810  | ✓                                                                                                  |
| u110 | hi      | 16/16 | 1649  | ✓                                                                                                  |
| u111 | hi      | 16/16 | 1910  | ✓                                                                                                  |
| u112 | hi      | 16/16 | 1580  | ✓                                                                                                  |
| u113 | hi      | 16/16 | 1884  | ✓                                                                                                  |
| u115 | hi      | 12/12 | 1347  | ✓                                                                                                  |
| u116 | hi      | 15/16 | 2526  | item0.unit: null ≠ fan                                                                             |
| u117 | hi      | 16/16 | 1184  | ✓                                                                                                  |
| u118 | hi      | 12/12 | 1589  | ✓                                                                                                  |
| u119 | hi      | 16/16 | 1774  | ✓                                                                                                  |
| u120 | hi      | 12/12 | 1554  | ✓                                                                                                  |
| u121 | hi      | 20/20 | 2188  | ✓                                                                                                  |
| u122 | hi      | 16/16 | 1795  | ✓                                                                                                  |
| u123 | hi      | 12/12 | 1770  | ✓                                                                                                  |
| u124 | hi      | 11/12 | 1281  | item0.match: rc_mcb_16a ≠ rc_mcb_32a_dp; TOTAL: ₹430 ≠ ₹640                                        |
| u125 | hi      | 20/20 | 1274  | ✓                                                                                                  |
| u126 | hi      | 12/12 | 1501  | ✓                                                                                                  |
| u127 | hi      | 7/8   | 1801  | items.count: 2 ≠ 0                                                                                 |
| u128 | hi      | 12/12 | 1488  | ✓                                                                                                  |
| u130 | hi      | 8/8   | 1090  | ✓                                                                                                  |
| u131 | hi      | 11/11 | 1727  | ✓                                                                                                  |
| u132 | hi      | 11/11 | 1448  | ✓                                                                                                  |
| u133 | hi      | 7/8   | 1622  | items.count: 1 ≠ 0                                                                                 |
| u134 | hi      | 12/12 | 1145  | ✓                                                                                                  |
| u135 | hi      | 11/12 | 1491  | item0.spokenUnitPrice: 222 ≠ 220                                                                   |
| u136 | hi      | 8/8   | 1305  | ✓                                                                                                  |
| u137 | hi      | 8/8   | 1265  | ✓                                                                                                  |
| u138 | hi      | 8/8   | 986   | ✓                                                                                                  |
| u139 | hi      | 8/8   | 571   | ✓                                                                                                  |
| u140 | hi      | 8/8   | 932   | ✓                                                                                                  |
| u141 | hi      | 8/8   | 606   | ✓                                                                                                  |
| u142 | hi      | 8/8   | 1105  | ✓                                                                                                  |
| u143 | en-IN   | 16/16 | 1538  | ✓                                                                                                  |
| u144 | en-IN   | 16/16 | 1284  | ✓                                                                                                  |
| u145 | en-IN   | 16/16 | 1172  | ✓                                                                                                  |
| u146 | en-IN   | 16/16 | 1046  | ✓                                                                                                  |
| u147 | en-IN   | 20/20 | 1201  | ✓                                                                                                  |
| u148 | en-IN   | 16/16 | 1106  | ✓                                                                                                  |
| u149 | en-IN   | 16/16 | 1079  | ✓                                                                                                  |
| u150 | en-IN   | 16/16 | 975   | ✓                                                                                                  |
| u151 | en-IN   | 12/12 | 798   | ✓                                                                                                  |
| u152 | en-IN   | 12/12 | 901   | ✓                                                                                                  |
| u153 | en-IN   | 12/12 | 815   | ✓                                                                                                  |
| u154 | en-IN   | 15/16 | 1350  | item0.unit: null ≠ fan                                                                             |
| u155 | en-IN   | 16/16 | 1669  | ✓                                                                                                  |
| u156 | en-IN   | 16/16 | 1193  | ✓                                                                                                  |
| u157 | en-IN   | 16/16 | 1146  | ✓                                                                                                  |
| u158 | en-IN   | 20/20 | 1070  | ✓                                                                                                  |
| u159 | en-IN   | 16/16 | 1176  | ✓                                                                                                  |
| u160 | en-IN   | 16/16 | 1349  | ✓                                                                                                  |
| u161 | en-IN   | 12/12 | 1396  | ✓                                                                                                  |
| u162 | en-IN   | 8/8   | 878   | ✓                                                                                                  |
| u163 | en-IN   | 12/12 | 871   | ✓                                                                                                  |
| u164 | en-IN   | 8/8   | 803   | ✓                                                                                                  |
| u165 | en-IN   | 8/8   | 934   | ✓                                                                                                  |
| u166 | en-IN   | 11/11 | 1003  | ✓                                                                                                  |
| u167 | en-IN   | 12/12 | 1240  | ✓                                                                                                  |

Item matches and bill totals use the on-device matcher and bill model (Phase 4).
