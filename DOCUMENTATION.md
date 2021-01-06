# API

| Method                                                              | What it does |
| --------------------------------------------------------------------| -------------|
| [`constructor`](#initializing)                                      | 
| [`on`](#adding-a-route)                                             | Registers a route |
| [`off`](#removing-a-route)                                          | Removes a registered route |
| [`navigate`](#navigating-between-routes)                            | Navigates to a route with a change of the browser URL. You usually are calling this as a result of user interaction. You want to change the URL. |
| [`resolve`](#resolving-routes)                                      | Navigates to a route but it doesn't change the browser URL. You should fire this at least one in the beginning. |
| [`match`](#direct-matching-of-registered-routes)                    | Checks if the passed path matches some of the routes. It doesn't trigger handlers or hooks. |
| [`matchLocation`](#direct-matching-of-paths)                        | The bare matching logic of Navigo |
| [`destroy`](#destroying-the-router)                                 | Removing the currently registered routes |
| [`notFound`](#handling-a-not-found-page)                            | Defining a not-found handler |
| [`updatePageLinks`](#augment-your-a-tags)                           | Call this if you re-render (change the DOM) and want Navigo to recognize the links with `data-navigo` attribute |
| [`link`](#generating-paths)                                         | Constructs a path |
| [`generate`](#generating-paths)                                     | Constructs a path based on a registered route |
| [`lastResolved`](#resolving-routes)                                 | Returns the last resolved route/s |
| [`hooks`](#defining-hooks-for-all-the-routes)                       | Define all-routes hooks |
| [`getCurrentLocation`](#getting-current-location-of-the-browser)    | Returns a [Match](#match) object for the current browser location |

# Topics

- [API](#api)
- [Topics](#topics)
  - [Initializing](#initializing)
  - [Adding a route](#adding-a-route)
    - [Parameterized routes](#parameterized-routes)
    - [Reading GET params](#reading-get-params)
    - [Matching logic](#matching-logic)
  - [Removing a route](#removing-a-route)
  - [Navigating between routes](#navigating-between-routes)
  - [Augment your `<a>` tags](#augment-your-a-tags)
    - [Passing options to the `navigate` method](#passing-options-to-the-navigate-method)
  - [Resolving routes](#resolving-routes)
    - [Resolve options](#resolve-options)
  - [Direct matching of registered routes](#direct-matching-of-registered-routes)
  - [Direct matching of paths](#direct-matching-of-paths)
  - [Hooks](#hooks)
    - [Type of hooks](#type-of-hooks)
    - [Defining hooks for specific route](#defining-hooks-for-specific-route)
    - [Defining hooks for all the routes](#defining-hooks-for-all-the-routes)
  - [Destroying the router](#destroying-the-router)
  - [Generating paths](#generating-paths)
  - [Handling a not-found page](#handling-a-not-found-page)
  - [Getting current location of the browser](#getting-current-location-of-the-browser)
  - [Types](#types)
    - [Navigo](#navigo)
    - [Match](#match)
    - [Route](#route)
    - [RouteHooks](#routehooks)
    - [NavigateOptions](#navigateoptions)
    - [ResolveOptions](#resolveoptions)

---

Types

| Object                               |
| -------------------------------------|
| [Navigo](#navigo)                    |
| [Match](#match)                      |
| [Route](#route)                      |
| [RouteHooks](#routehooks)            |
| [NavigateOptions](#navigateoptions)  |
| [ResolveOptions](#resolve-options)   |

## Initializing

Navigo constructor has one mandatory argument - the root path of your application. For example, if you are hosting the application at `https://site.com/my/project` you have to specify the following:

```js
const router = new Navigo('/my/project');
```

The second argument is the default [resolving options](#resolve-options). The `strategy` field there defines how many matches the router finds - one or many.

```js
const router = new Navigo('/my/project', { strategy: 'ALL' });
```

By default the strategy is equal to `"ONE"`. Meaning that when a match is found the router stops resolving other routes.

Another option available is `noMatchWarning`. Which if you set to `true` will prevent the router of warning a message if there is no matching route.

## Adding a route

```typescript
interface Navigo {
  on(path: string, f: Function, hooks?: RouteHooks): Navigo;
  on(f: Function, hooks?: RouteHooks): Navigo;
  on(map: Object, hooks?: RouteHooks): Navigo;
}
```

To add a route use the `on` method. It can be used in four different ways. The first and the most straightforward one is when you have a path and want to map it to a function.

```js
const router = new Navigo('/');
router.on('/foo/bar', () => {
  // Fired if the page URL matches '/foo/bar'.
});
```

The path in this case could be also a regular expression. For example:

```js
const router = new Navigo('/');
router.on(/foo\/(.*)/, () => {
  // Fired if the page URL matches '/foo/bar'.
});
```

If you skip the path you are basically defining a handler for your root.

```js
const router = new Navigo('/my/app');
router.on(() => {
  // Fired if the page URL matches '/my/app' route.
  // Or in other words the home of your app.
})
```

The `on` method is chainable so you can call `on('...', () => {}).on('...', () => {})` if you want.

The next option is to define a key-value pairs of your routes:

```js
router.on({
  '/foo/bar': () => {
    // Fired if the route matches '/foo/bar'.
  },
  '/foo/zar': () => {
    // Fired if the route matches '/foo/zar'.
  }
});
```

And the most complex one is by giving your route a name (via the `as` field). This could be used in a combination of the [generate](#generating-paths) method to construct a page path or simply to identify what is currently matching.

```js
router.on({
  '/foo/bar': {
    as: 'routeA',
    uses: () => {
       // Fired if the route matches '/foo/bar'.
    }
  }
  '/foo/bar': {
    as: 'routeB',
    uses: () => {
       // Fired if the route matches '/foo/bar'.
    }
  }
})
```

Notice the typing of the `on` method in the beginning of this section and you'll see that you can pass hooks to each route. More about that in the [hooks](#hooks) section.

### Parameterized routes

The parameterized routes have paths that contain dynamic parts. For example:

```js
const router = new Navigo('/');

router.on('/user/:id/:action', ({ data }) => {
  console.log(data); // { id: 'xxx', action: 'save' }
});

router.resolve('/user/xxx/save');
```

`"/user/xxx/save"` matches the defined route. `"xxx"` maps to `id` and `"save"` to `action`. The data from the URL comes into the `data` field of the [Match](#match) object passed to your handler.

Parameterized routes happen also when we use a regular expression as a path. It's just our `data` property comes as an array containing the matched groups.

```js
const router = new Navigo('/');
router.on(/rock\/(.*)\/(.*)/, ({ data }) => {
  console.log(data); // ["paper", "scissors"]
});
router.resolve("/rock/paper/scissors");
```

### Reading GET params

Navigo captures the GET params of the matched routes. For example:

```js
const router = new Navigo('/');

router.on('/user/:id/:action', ({ data, params, queryString }) => {
  console.log(data); // { id: 'xxx', action: 'save' }
  console.log(params); // { m: "n", k: "z" }
  console.log(queryString); // "m=n&k=z"
});

router.resolve('/user/xxx/save?m=n&k=z');
```

### Matching logic

Navigo relies on regular expressions to match strings against location paths. This logic is abstracted and for the final user we have a simple [DSL](https://en.wikipedia.org/wiki/Domain-specific_language). Here are couple of examples:

```js
router.on('/foo', () => {});
// matches specifically "/foo"

router.on('/foo/:name', () => {});
// matches "/foo/my-name-here"

router.on(':page', () => {});
// matches "/about-page"

router.on('/foo/*', () => {});
// matches "/foo/a/b/c"

router.on('*', () => {});
// matches "/foo/bar/moo"

router.on(/rock\/(.*)\/(.*)/, () => {});
// matches "/rock/paper/scissors"

router.on('/foo/:id/?', () => {});
// matches "/foo/20/save" and also "/foo/20"
```

## Removing a route

```typescript
interface Navigo {
  off(path: string | RegExp): Navigo;
  off(handler: Function): Navigo;
}
```

To remove a route call the `off` method by passing the path (or the used regular expression) or the handler of the route.

## Navigating between routes

```typescript
interface Navigo {
  navigate(to: string, options?: NavigateOptions): void;
}

type NavigateOptions = {
  title?: string;
  stateObj?: Object;
  historyAPIMethod?: string;
  updateBrowserURL?: boolean;
  callHandler?: boolean;
  updateState?: boolean;
  force?: boolean;
  resolveOptions?: ResolveOptions;
};
```

The `navigate` method by default:

* Checks if there is a match. And if the answer is "yes" then ...
* It calls hooks (if any) and your route handler.
* Updates the internal state of the router.
* Updates the browser URL.

Consider the following example:

```js
const router = new Navigo("/");

router
  .on("/foo/bar", () => {
    console.log('Nope');
  })
  .on("/about", () => {
    console.log('This is About page');
  });

router.navigate("about");
```

After the last line the browser will have in its address bar `/about` as a path and in the console we'll see `"This is About page"`. `router.lastResolved()` and `router.current` will point to an array of a single object of type [Match](#match).

`navigate` accepts a few options:

* `title` is a string that gets passed to `pushState` (or `replaceState`).
* `stateObj` is a state object that gets passed to `pushState` (or `replaceState`).
* If you don't want to have a new entry in the history you should pass `{ historyAPIMethod: 'replaceState' }`. By default is `pushState`.
* If `updateBrowserURL` is set to `false` the library will not use the history API at all. Meaning, the browser URL will not change.
* If `callHandler` is set to `false` your route handler will not be fired.
* If `updateState` is set to `false` the router will not update its internal state. This means that the `lastResolved()`/`current` route will not be updated.
* If `force` is set to `true` the router will update its internal state only. This makes the router like it already resolved specific URL.
* `resolveOptions` are the same options used in the [resolve](#resolving-routes) method.

## Augment your `<a>` tags

Let's say that we have a page with links (`<a>` tags). The links have `href` attributes pointing to locations inside your app. By default Navigo doesn't know about those links and if you click them you'll probably get a full page load. To augment those links and integrate them with Navigo just add `data-navigo` attribute. For example:

```html
<a href="/company/about" data-navigo>About</a>
```

When Navigo is initialized checks the page for such tags and attaches `click` handler which fires the router's `navigate` method.

Navigo has a method called `updatePageLinks` which you have to call every time when you change the DOM and you expect to see new links on the page. Because Navigo is not wired to a rendering engine doesn't really know about the DOM manipulations. It does though makes an assumption - after each of your route handlers there is a `updatePageLinks` call. The router expects that after the successful route resolving the DOM is updated and calls that function again. Feel free to fire `updatePageLinks` multiple times on the same DOM tree. There will be just one `click` handler attached to your links.

### Passing options to the `navigate` method

As we learned above, when a link with `data-navigo` attribute is clicked the `navigate` method of the router gets executed. That same method accepts options and if you want to pass some of them use the following syntax:

```html
<a href="/foo/bar" data-navigo data-navigo-options="updateBrowserURL:false, callHandler: false, updateState: false, force: false, historyAPIMethod: replaceState, resolveOptionsStrategy: ALL">my link</a>
```

Which will result in the following options:

```js
{
  updateBrowserURL: false,
  callHandler: false,
  updateState: false,
  force: false,
  historyAPIMethod: "replaceState",
  resolveOptions: { strategy: "ALL", noMatchWarning: false },
}
```

## Resolving routes

```typescript
interface Navigo {
  resolve(path?: string, resolveOptions?: ResolveOptions): false | Match[];
}

export type ResolveOptions = {
  strategy?: ONE | ALL;
  noMatchWarning?: true | false;
};
type Match = {
  url: string;
  queryString: string;
  route: Route;
  data: Object | null;
  params: Object | null;
};
type Route = {
  name: string;
  path: string;
  handler: Function;
  hooks: RouteHooks;
};
```

By default Navigo is not resolving your routes. You have to at least once call `resolve` method. The `path` argument is not mandatory. If you skip it the library will use the current URL of the page. The method is fired automatically in the following cases:

* If there is a `popstate` event dispatched (this happens when the user manually changes the browser location by hitting for example the back button)
* If the `navigate` method is called and `shouldResolve` is not set to `false`

By default the `resolve` function catches the first match and stops searching. You can amend this behavior by passing `"ALL"` as a value of the `strategy` field. However, if there is a matching route you'll get an array of object (or objects) of type [Match](#match). If there is no match then `resolve` returns `false`. When your route gets resolved its handler is called. It receives a [Match](#match) object. From that object you can pull the data passed through the URL (if you used a parameterized path) or the GET params set in the URL.

If you need to see the latest match (or matches) you can access it via the `lastResolved()` method.

`resolve` does the following:

* Checks if there is a match. And if the answer is "yes" then ...
* It calls hooks (if any) and your route handler.
* Updates the internal state of the router.

Another option available is `noMatchWarning`. Which if you set to `true` will prevent the router of warning a message if there is no matching route.

### Resolve options

```typescript
export type ResolveOptions = {
  strategy?: ONE | ALL;
  noMatchWarning?: true | false;
};
```

* `strategy` - either `"ONE"` (by default) or `"ALL"`.
* `noMatchWarning` - `false` (by default) or `true`

## Direct matching of registered routes

If you want to check if some path is matching any of the routes without triggering hooks, handlers or changing the browser URL you may use the `match` method. For example:

```js
const r: Navigo = new Navigo("/");

r.on("/user/:id", () => {});

console.log(r.match("/nope"));
// result: false

console.log(r.match("/user/xxx/?a=b"));
// result:
// [
//   {
//     data: {
//       id: "xxx",
//     },
//     params: { a: "b" },
//     queryString: "a=b",
//     route: {
//       handler: [Function],
//       hooks: undefined,
//       name: "user/:id",
//       path: "user/:id",
//     },
//     url: "user/xxx",
//   }
// ]
```

The function returns an array of [Match](#match) objects or `false`.

## Direct matching of paths

There is a `matchLocation` method that offers the bare matching logic of the router. You pass a `path` and it checks if the string matches the current location. If you don't want to use the current location of the browser you may send a second argument. For example:

```js
// let's say that the path of the browser is "/foo/bar?a=b"
router.matchLocation('/foo/:id');
/*
{
  data: {
    id: "bar",
  },
  params: { a: "b" },
  queryString: "a=b",
  route: {
    handler: expect.any(Function),
    hooks: {},
    name: "foo/:id",
    path: "foo/:id",
  },
  url: "foo/bar",
}
*/

// passing the current location manually
r.matchLocation("/foo/:id", "/foo/bar?a=b");
```

The method returns false if there is no match.

## Hooks

The _hooks_ are functions that are fired as part of the resolving process. Think about them as lifecycle methods.

### Type of hooks

The hooks object has the following signature:

```typescript
type RouteHooks = {
  before?: (done: Function, match: Match) => void;
  after?: (match: Match) => void;
  leave?: (done: Function, match: Match) => void;
  already?: (match: Match) => void;
};
```

* The `before` hook receives two arguments. The first one is a function that needs to be called with either no arguments or `false`. The no-argument version means "move forward". `false` stops the resolving and your handler will not be called.
* `after` is called after your handler
* `leave` is called when you are about to leave out of the route. Similarly to the `before` hook accepts a function as first argument and a [Match](#match) object as second. If the function is called with `false` Navigo will stop resolving the new matched route meaning "we cant' go out of the current route".
* `already` is called when this is the current route and it matches again

### Defining hooks for specific route

The `on` method accepts a hooks object as a last argument. For example:

```js
// for specific path
router.on('/foo/bar/', () => {...}, {
  before(done, match) {
    // do something
    done();
  }
});

// for the root
router.on(() => {...}, {
  before(done, match) {
    // do something
    done();
  }
});

// when using a route map
r.on({
  "/foo/:id": {
    as: "some.name",
    uses: handler,
    hooks: {
      before: (done) => {
        // do something
        done();
      },
    },
  },
});

// with the notFound method
router.notFound(() => {...}, {
  before(done, match) {
    // do something
    done();
  }
});
```

### Defining hooks for all the routes

You can define hooks that will be used for all the registered routes. It is important to set the hooks before the other route definition.

```js
const router = new Navigo("/");
router.hooks({
  before(done, match) {
    // do something
    done();
  }
});
router.on("/foo/bar", () => {});
router.on("/", () => {});
```

## Destroying the router

```typescript
destroy(): void;
```

If you no longer need Navigo working just call `router.destroy()`. This will flush all the registered routes so nothing will match.

## Generating paths

There are two methods `link` and `generate` that you can use to create string paths. For example:

```js
const router = new Navigo('/my/app');

router.link('blah'); // "/my/app/blah

router.on({
  "/user/:id/:action": { as: "RouteNameHere", uses: () => {} },
});

r.generate("RouteNameHere", { id: "xxx", action: "save" }); // "/my/app/user/xxx/save"
```

Notice that the produced strings start always with the root that you passed to the Navigo's constructor.

## Handling a not-found page

```typescript
interface Navigo {
  notFound(handler: Function, hooks?: RouteHooks): Navigo;
}
```

Navigo offers a special handler for the cases where a no match is found.

```js
const router = new Navigo('/');

router.notFound(() => {
  // this runs if there is no match found
});
```

## Getting current location of the browser

`router.getCurrentLocation()` returns the current location of the browser in the format of a [Match](#match) object.

## Types

### Navigo

```typescript
class Navigo {
  constructor(root: string, resolveOptions?: ResolveOptions);
  destroyed: boolean;
  current: Match[];
  routes: Route[];
  on(f: Function, hooks?: RouteHooks): Navigo;
  on(map: Object, hooks?: RouteHooks): Navigo;
  on(path: string | RegExp, f: Function, hooks?: RouteHooks): Navigo;
  off(path: string | RegExp): Navigo;
  off(handler: Function): Navigo;
  navigate(to: string, options?: NavigateOptions): void;
  resolve(path?: string, resolveOptions?: ResolveOptions): false | Match;
  destroy(): void;
  notFound(handler: Function, hooks?: RouteHooks): Navigo;
  updatePageLinks(): Navigo;
  link(path: string): string;
  lastResolved(): null | Match[];
  generate(name: string, data?: Object): string;
  hooks(hooks: RouteHooks): Navigo;
  getLinkPath(link: Object): string;
  match(path: string): false | Match[];
  matchLocation(path: string, currentLocation?: string): false | Match;
  getCurrentLocation(): Match;
}
```

### Match

```typescript
type Match = {
  url: string;
  queryString: string;
  route: Route;
  data: Object | null;
  params: Object | null;
};
```

### Route

```typescript
type Route = {
  name: string;
  path: string | RegExp;
  handler: Function;
  hooks: RouteHooks;
};
```

### RouteHooks

```typescript
type RouteHooks = {
  before?: (done: Function, match: Match) => void;
  after?: (match: Match) => void;
  leave?: (done: Function, match: Match) => void;
  already?: (match: Match) => void;
};
```

### NavigateOptions

```typescript
type NavigateOptions = {
  title?: string;
  stateObj?: Object;
  historyAPIMethod?: string;
  updateBrowserURL?: boolean;
  callHandler?: boolean;
  updateState?: boolean;
  force?: boolean;
  resolveOptions?: ResolveOptions;
};
```

### ResolveOptions

```typescript
export type ResolveOptions = {
  strategy?: ONE | ALL;
  noMatchWarning?: true | false;
};
```