# Hati

Example app built to show Fenrir's features.

It is a demo representing an email message analysis pipeline
written through a monolithic approach, later converted in serverless style.

To run the monolithic code:

```console
$ pnpm full:dev
```

To run the serverless code:

```console
// start the offline gateway
$ pnpm serve
// run the code
$ pnpm less:dev
```

The transpiled code can already be seen in the `output` directory.
