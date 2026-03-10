import { Navigate } from "react-router-dom";
import { ROUTES } from "../routes";

export default function Home() {
  return <Navigate to={ROUTES.login} replace />;
}
