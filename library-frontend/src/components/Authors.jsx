import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { AUTHORS, EDIT } from "../queries";
export default function Authors({ loggedIn, notify }) {
  const { data, loading, error } = useQuery(AUTHORS);
  const [name, setName] = useState(""),
    [born, setBorn] = useState("");
  const [edit, { loading: saving }] = useMutation(EDIT, {
    refetchQueries: [AUTHORS],
  });
  if (loading) return <p role="status">Loading authors…</p>;
  if (error) return <p role="alert">Could not load authors. Please reload.</p>;
  const submit = async (e) => {
    e.preventDefault();
    try {
      await edit({ variables: { name, setBornTo: Number(born) } });
      setBorn("");
      notify("Birth year updated.");
    } catch (e) {
      notify(e.message, true);
    }
  };
  return (
    <section>
      <h2>authors</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>born</th>
            <th>books</th>
          </tr>
        </thead>
        <tbody>
          {data.allAuthors.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born ?? "—"}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loggedIn && (
        <form onSubmit={submit}>
          <h3>Set birthyear</h3>
          <label>
            name
            <select
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            >
              <option value="">Choose an author</option>
              {data.allAuthors.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            born
            <input
              type="number"
              required
              value={born}
              onChange={(e) => setBorn(e.target.value)}
            />
          </label>
          <button disabled={saving}>update author</button>
        </form>
      )}
    </section>
  );
}
