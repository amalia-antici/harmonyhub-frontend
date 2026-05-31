import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {

  const navigate = useNavigate(); //

  const handleJoinClick = () => {
    navigate("/login");
  };

  return (
    <>
      <Navbar />

      <div className="introduction">
        <img src="/body.png" alt="body" />
        <button onClick={handleJoinClick}>Join us!</button>
      </div>
    </>
  );
}