# Wompo Router

Wompo-Router is a Wompo based library to create Single Page Applications using client routing.
Wompo Router uses nested routes to create layouts, based on the famous React-Router library.

## API

Wompo Router exposes the following components to create routes:

- `Routes` - It's the component that will include the whole routing logic. Accepts no props.
- `Route` - Define a single route. Accepts the following props:
  ```ts
  interface RouteProps extends WompoProps {
    path?: string; // The path of the route.
    index?: boolean; // True if the route is an index route (of the parent).
    redirect?: string; // If valorized, the route will redirect to another one.
    element?: RenderHtml; // The element to render.
    lazy?: () => LazyCallbackResult; // If valorized, must be a callback that returns a lazy component.
    fallback?: RenderHtml; // The fallback element to visualize while a lazy component is being imported.
  }
  ```
- `ChildRoute` - Defines where a child route should be rendered inside the parent route. Accepts no props.

It also exposes this helper components:

- `Link` - The component you want to use to navigate across routes. Accepts a single prop: _to_ (the link).
- `NavLink` - Same as Link, but will have an "active" class if the current route corresponds to the link.
  Accepts a single prop: _to_ (the link).

Finally, Wompo Router has the following hooks:

- `useParams` - Will return the parameters for the current route.
- `useNavigate` - Will return a **navigate** function that you can use to manually navigate across routes.
- `useCurrentRoute` - Will return the current route.

## Creating an Application

This is an example of an application made with Wompo Router:

```javascript
function App(){
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/docs' element={<DocsLayout />}>
        <Route path="overview" element={<Overview />} />
        <Route path="quick-start" element={<QuickStart />} />
        <Route path="hooks" element={<Hooks />}>
          <Route path=":name" element={<Hook />} />
        </Route>
        <Route index redirect="overview" />
      </Route>
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
}
```

The above routing system will generate the following routes:

- /
- /docs ---> will redirect to ---> /docs/overview
- /docs/overview
- /docs/hooks
- /docs/hooks/:name (where "name" is a parameter in the url)

All the other routes will fallback into the `NotFound` Page.

So, if you go to the url _/docs/hooks/useNavigate_, Womp Router will render the
following nested routes where "useNavigate" is assigned to the "name" parameter:

```javascript
<DocsLayout>
  <Hooks>
    <Hook />
  </Hooks>
</DocsLayout>
```

Actually, this process of nested routes will not happen automatically: the components
`DocsLayout` and `Hooks` will have to tell "Womp Router" where to render the nested
route. To do that, you use the `ChildRoute` component.

Example of `DocsLayout`:

```javascript
<header>...</header>
<main>
  <ChildRoute />
</main>
<footer>...</footer>
```