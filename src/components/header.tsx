import logoMediall from "../assets/Logo_mediall.png";

export default function Header() {
  return (
    <header className="bg-white shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
        <img
          src={logoMediall}
          alt="Mediall"
          className="h-16 object-contain"
        />
      </div>
    </header>
  );
}
