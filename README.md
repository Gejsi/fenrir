<h1 align='center'>Fenrir</h1>

A transpiler that simplifies the development of serverless functions.

---

### Packages - core

Contains the main source code.

Run typescript code:

```console
$ turbo run dev --filter core
```

Bundle into a `dist` folder:

```console
$ turbo run build --filter core
```

### Apps - hati

Contains example cloud functions.
To run them from the root of the project, firstly start the offline server:

```console
$ pnpm -F hati serve
```

Then invoke a function on another console.

```console
$ pnpm -F hati hello
```
