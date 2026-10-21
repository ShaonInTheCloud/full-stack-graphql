import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { ADD, AUTHORS } from "../queries";
export default function NewBook({ notify, onSaved }) {
  const [title, setTitle] = useState(""),
    [author, setAuthor] = useState(""),
    [published, setPublished] = useState(""),
    [genre, setGenre] = useState(""),
    [genres, setGenres] = useState([]);
  const [add, { loading }] = useMutation(ADD, {
    refetchQueries: [AUTHORS, "Books"],
    awaitRefetchQueries: true,
  });
  const addGenre = () => {
    const g = genre.trim();
    if (g) setGenres((gs) => [...new Set([...gs, g])]);
    setGenre("");
  };
  const submit = async (e) => {
    e.preventDefault();
    const all = [
      ...new Set([...genres, ...(genre.trim() ? [genre.trim()] : [])]),
    ];
    try {
      await add({
        variables: {
          title: title.trim(),
          author: author.trim(),
          published: Number(published),
          genres: all,
        },
      });
      setTitle("");
      setAuthor("");
      setPublished("");
      setGenres([]);
      setGenre("");
      notify("Book added.");
      onSaved();
    } catch (e) {
      notify(e.message, true);
    }
  };
  return (
    <section>
      <h2>Add a book</h2>
      <form onSubmit={submit}>
        <label>
          title
          <input
            minLength={5}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          author
          <input
            minLength={4}
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <label>
          published
          <input
            type="number"
            required
            value={published}
            onChange={(e) => setPublished(e.target.value)}
          />
        </label>
        <label>
          genre
          <input value={genre} onChange={(e) => setGenre(e.target.value)} />
        </label>
        <button type="button" onClick={addGenre}>
          add genre
        </button>
        <p>genres: {genres.join(", ")}</p>
        <button disabled={loading}>create book</button>
      </form>
    </section>
  );
}
