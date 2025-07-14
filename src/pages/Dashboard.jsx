import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function Dashboard() {
  const [tokens, setTokens] = useState([]);

  const fetchData = async () => {
    const snap = await getDocs(collection(db, "tokens"));
    const data = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        created: d.created_at?.toDate().toLocaleString() || "—",
        usedBy: d.used_by?.length || 0,
      };
    });
    setTokens(data.reverse());
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📊 Dashboard Token</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Token</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Dibuat</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Sudah Dipakai</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Link</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.id}>
              <td style={{ padding: "10px", border: "1px solid #ccc" }}>{token.id}</td>
              <td style={{ padding: "10px", border: "1px solid #ccc" }}>{token.created}</td>
              <td style={{ padding: "10px", border: "1px solid #ccc" }}>{token.usedBy}</td>
              <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                <a
                  href={`/redeem?token=${token.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  🔗 Lihat
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
