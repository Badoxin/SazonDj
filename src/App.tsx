import "./App.scss";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import { Navigation } from "./routes";

function App() {
  return (
    <AuthProvider>
      <Navigation />
      <ToastContainer position="bottom-center" autoClose={5000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover={false} />
    </AuthProvider>
  );
}

export default App;
