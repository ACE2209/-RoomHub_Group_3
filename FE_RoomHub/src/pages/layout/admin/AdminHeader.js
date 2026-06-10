export default function AdminHeader() {
  return (
    <header className="admin-header">
      <div></div>

      <div className="header-right">
        <input
          className="search-box"
          placeholder="Tìm kiếm review..."
        />


        <img
          className="avatar"
          alt="admin"
        />
      </div>
    </header>
  );
}