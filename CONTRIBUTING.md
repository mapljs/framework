# Setup package
```sh
node scripts/src/setup.mts # setup package.json
upm i @mapl/framework@link:dist --dev # install all packages, link package for testing

# predefined scripts 
upm fmt # format with oxfmt
upm test # run test with node test runner
```

Configurations are in [./scripts/config.mts](./scripts/config.mts).
