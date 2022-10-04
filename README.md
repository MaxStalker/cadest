## Cadest - Fast Cadence Testing
Cadence testing with Javascript can be slow some times.
This library tries to make it as snappy and fast as possible. We do it by eliminating all unnecessary steps:
- transaction signature validation is disabled - you will need Flow CLI `v.0.39.3` or higher
- FCL replaced with direct REST API calls
- small performance improvements here and there to squeeze maximum speed