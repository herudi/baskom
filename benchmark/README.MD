# Benchmark
Server => Nodejs v10.17.0, Ubuntu 16.04.6 LTS, Memory 16GB, Processor Intel(R) Xeon(R) Gold 6126 CPU @ 2.60GHz.
<br></br>
Usage => yarn bench
```bash
┌───────────┬─────────┬──────────────┬─────────┬───────────────┐
│           │ Version │ Requests/sec │ Latency │ Throughput/Mb │
├───────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Baskom    │ 0.0.9   │ 53980.8      │ 1.75    │ 5.66          │
├───────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Fastify   │ 3.8.0   │ 48304        │ 1.95    │ 6.96          │
├───────────┼─────────┼──────────────┼─────────┼───────────────┤
│ RayoStorm │         │ 46403.2      │ 2.08    │ 4.87          │
├───────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Polka     │ 0.5.2   │ 45648        │ 2.08    │ 4.79          │
├───────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Rayo      │ 1.3.6   │ 41569.6      │ 2.28    │ 4.36          │
├───────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Express   │ 4.17.1  │ 20836.8      │ 4.68    │ 4.25          │
└───────────┴─────────┴──────────────┴─────────┴───────────────┘
```

## Proof Screenshot
<img src="https://raw.githubusercontent.com/herudi/baskom/main/benchmark/screenshot.png" alt="imagestea" />

## License
Big Thanks for original code benchmarking : [https://github.com/GetRayo/rayo.js/tree/master/packages/benchmarks](https://github.com/GetRayo/rayo.js/tree/master/packages/benchmarks)

[MIT](https://github.com/GetRayo/rayo.js/blob/master/LICENSE)
