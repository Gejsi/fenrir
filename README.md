<h1 align='center'>Fenrir</h1>

This project is a monorepo still under development.

---

### Packages - core

Contains the main source code.

Run typescript code:

```console
$ turbo run dev
```

Bundle into a `dist` folder:

```console
$ turbo run build
```

### Apps - funx

Contains example cloud functions.
To run them from the root of the project, firstly start the offline server:

```console
$ pnpm -F funx serve
```

Then invoke a function on another console.

```console
$ pnpm -F funx hello
```
