import { useCallback, useEffect, useRef, useState } from "react";
import {
  useApolloClient,
  useMutation,
  useSubscription,
} from "@apollo/client/react";
import { ADDED, LOGIN } from "./queries";
import { session } from "./client";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
function Login({ notify, onLogin }) {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState("");
  const [login, { loading }] = useMutation(LOGIN);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login({ variables: { username, password } });
      onLogin(data.login.value);
    } catch {
      notify("login failed: check your username and password.", true);
    }
  };
  return (
    <section>
      <h2>Log in</h2>
      <form onSubmit={submit}>
        <label>
          username
          <input
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button disabled={loading}>login</button>
      </form>
    </section>
  );
}
export default function App() {
  const [page, setPage] = useState("authors"),
    [token, setToken] = useState(session.get),
    [notice, setNotice] = useState(null);
  const timer = useRef(null);
  const client = useApolloClient();
  const notify = useCallback((message, error = false) => {
    clearTimeout(timer.current);
    setNotice({ message, error });
    timer.current = setTimeout(() => setNotice(null), 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  useSubscription(ADDED, {
    onData: ({ data }) => {
      const b = data.data?.bookAdded;
      if (!b) return;
      notify("New book: " + b.title);
      client.cache.evict({ id: "ROOT_QUERY", fieldName: "allBooks" });
      client.cache.evict({ id: "ROOT_QUERY", fieldName: "allAuthors" });
      client.cache.gc();
      void client.refetchQueries({ include: ["Books", "Authors"] });
    },
  });
  const login = (token) => {
    session.save(token);
    setToken(token);
    setPage("authors");
    void client.resetStore();
  };
  const logout = () => {
    session.remove();
    setToken(null);
    setPage("authors");
    void client.resetStore();
  };
  return (
    <>
      <header>
        <p className="eyebrow">A shared collection</p>
        <h1>The Library</h1>
        <nav aria-label="Library navigation">
          <button onClick={() => setPage("authors")}>authors</button>
          <button onClick={() => setPage("books")}>books</button>
          {token ? (
            <>
              <button onClick={() => setPage("new")}>add book</button>
              <button onClick={() => setPage("recommend")}>recommend</button>
              <button onClick={logout}>logout</button>
            </>
          ) : (
            <button onClick={() => setPage("login")}>login</button>
          )}
        </nav>
      </header>
      <main>
        {notice && (
          <p
            className={notice.error ? "notice error" : "notice"}
            role={notice.error ? "alert" : "status"}
          >
            {notice.message}
          </p>
        )}
        {page === "authors" && <Authors loggedIn={!!token} notify={notify} />}{" "}
        {page === "books" && <Books />}
        {page === "recommend" && token && <Books key="recommend" recommend />}
        {page === "new" && token && (
          <NewBook notify={notify} onSaved={() => setPage("books")} />
        )}{" "}
        {page === "login" && <Login notify={notify} onLogin={login} />}
      </main>
      <footer>Full Stack Open · GraphQL library</footer>
    </>
  );
}
