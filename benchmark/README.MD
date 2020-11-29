# Benchmark
Server => Nodejs v10.17.0, Ubuntu 16.04.6 LTS, Memory 16GB, Processor Intel(R) Xeon(R) Gold 6126 CPU @ 2.60GHz.
<br></br>
Usage => yarn bench
|Frameworks |Version |Requests/sec |Latency |Throughput/Mb |
|--- |--- |--- |--- |--- |
|Baskom|0.0.10|61609.6|1.51|6.46|
|Fastify|3.8.0|53987.2|1.75|7.77|
|Polka|0.5.2|52323.2|1.8|5.49|
|Rayo|1.3.6|43312|2.19|4.54|
|RayoStrom|-|39561.6|2.45|4.15|
|Express|4.17.1|20792|4.7|4.24|

## Proof Screenshot
<img src="https://raw.githubusercontent.com/herudi/baskom/main/benchmark/screenshot.png" alt="imagestea" />

## License
Big Thanks for original code benchmarking : [https://github.com/GetRayo/rayo.js/tree/master/packages/benchmarks](https://github.com/GetRayo/rayo.js/tree/master/packages/benchmarks)

[MIT](https://github.com/GetRayo/rayo.js/blob/master/LICENSE)
