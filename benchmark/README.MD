# Benchmark
Usage => autocannon -c 100 -d 40 -p 10 localhost:3000

|Framework |Output |Version |
|--- |--- |--- |
|Native|1296k requests in 40.13s, 133 MB read|-|
|Baskom|1222k requests in 40.13s, 138 MB read|0.0.1|
|Fastify|1173k requests in 40.13s, 169 MB read|3.7.0|
|Koa|829k requests in 40.13s, 119 MB read|2.13.0|
|Express|496k requests in 40.13s, 103 MB read|4.17.1|