import logoMediall from "../assets/Logo_mediall.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
        <img
          src={logoMediall}
          alt="Mediall"
          className="h-17 object-contain"
        />
      </div>
    </header>
  );
}
