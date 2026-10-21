import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { BOOKS, ME } from "../queries";
function Table({ books }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>author</th>
          <th>published</th>
        </tr>
      </thead>
      <tbody>
        {books.map((b) => (
          <tr key={b.id}>
            <td>{b.title}</td>
            <td>{b.author.name}</td>
            <td>{b.published}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export default function Books({ recommend = false }) {
  const [genre, setGenre] = useState(null);
  const me = useQuery(ME, { skip: !recommend });
  const all = useQuery(BOOKS, {
    variables: { genre: null },
    fetchPolicy: "cache-and-network",
  });
  const selected = recommend ? me.data?.me?.favoriteGenre : genre;
  const result = useQuery(BOOKS, {
    variables: { genre: selected || null },
    skip: recommend && !me.data?.me,
    fetchPolicy: "cache-and-network",
  });
  const genres = [
    ...new Set((all.data?.allBooks || []).flatMap((b) => b.genres)),
  ].sort();
  const error = result.error || all.error || me.error;
  return (
    <section>
      <h2>{recommend ? "recommendations" : "books"}</h2>
      {recommend ? (
        <p>
          books in your favorite genre <strong>{selected}</strong>
        </p>
      ) : (
        genre && (
          <p>
            in genre <strong>{genre}</strong>
          </p>
        )
      )}
      {error ? (
        <p role="alert">Could not load books. Please reload.</p>
      ) : result.loading && !result.data ? (
        <p role="status">Loading books…</p>
      ) : (
        <Table books={result.data?.allBooks || []} />
      )}{" "}
      {!recommend && (
        <div className="genres">
          {genres.map((g) => (
            <button
              key={g}
              className={g === genre ? "selected" : ""}
              onClick={() => setGenre(g)}
            >
              {g}
            </button>
          ))}
          <button onClick={() => setGenre(null)}>all genres</button>
        </div>
      )}
    </section>
  );
}
