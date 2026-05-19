import { useState, useMemo } from "react";
import "./ClassListSection.css";
const MAX_CLASS = 5;
const PAGE_SIZE = 6;

const mockClasses = [
  { id: 1, className: "EXE101_G08", field: "Kinh tế", mentor: "Nguyễn Văn A", registered: 3 },
  { id: 2, className: "PRN211_SE16", field: "IT", mentor: "Lê Thị B", registered: 1 },
  { id: 3, className: "UXD301_UX01", field: "Thiết kế", mentor: "Phạm Văn C", registered: 5 },
  { id: 4, className: "MKG201_M02", field: "Marketing", mentor: "Trần Thị D", registered: 4 },
  { id: 5, className: "CSD201_G10", field: "IT", mentor: "Hoàng Văn E", registered: 2 },
  { id: 6, className: "EXE201_G02", field: "Kinh tế", mentor: "Đặng Văn F", registered: 5 },
];


export default function ClassListSection({ user, onRequireLogin }) {
  const [classes, setClasses] = useState(mockClasses);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("Tất cả lĩnh vực");
  const [currentPage, setCurrentPage] = useState(1);

  // ================= FILTER =================
  const filteredData = useMemo(() => {
    return classes.filter((item) => {
      const matchSearch =
        item.className.toLowerCase().includes(search.toLowerCase()) ||
        item.mentor.toLowerCase().includes(search.toLowerCase());

      const matchField =
        fieldFilter === "Tất cả lĩnh vực" || item.field === fieldFilter;

      return matchSearch && matchField;
    });
  }, [classes, search, fieldFilter]);

  // ================= PAGINATION =================
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ================= REGISTER =================
  const handleRegister = (id) => {
    if (!user) {
      onRequireLogin();
      return;
    }

    setClasses((prev) =>
      prev.map((item) =>
        item.id === id && item.registered < MAX_CLASS
          ? { ...item, registered: item.registered + 1 }
          : item
      )
    );
  };

//   const getFieldColor = (field) => {
//     switch (field) {
//       case "IT":
//         return "badge-it";
//       case "Kinh tế":
//         return "badge-kinhte";
//       case "Marketing":
//         return "badge-marketing";
//       case "Thiết kế":
//         return "badge-design";
//       default:
//         return "badge-default";
//     }
//   };

  return (
    <section className="class-section">
      <h2 className="class-title">Danh sách lớp đang mở</h2>

      {/* TOP BAR */}
      <div className="class-topbar">
        <input
          type="text"
          placeholder="Tìm kiếm tên lớp hoặc mentor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
        >
          <option>Tất cả lĩnh vực</option>
          <option>IT</option>
          <option>Kinh tế</option>
          <option>Marketing</option>
          <option>Thiết kế</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>TÊN LỚP</th>
              <th>LĨNH VỰC</th>
              <th>TÊN MENTOR</th>
              <th>SỐ LỚP ĐĂNG KÝ</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => {
                // console.log("Item:", item);  
              const isFull = item.registered >= MAX_CLASS;

              return (
                <tr key={item.id} className={isFull ? "row-disabled" : ""}>
                  <td>{item.className}</td>

                  {/* <td>
                    <span className={`badge ${getFieldColor(item.field)}`}>
                      {item.field}
                    </span>
                  </td> */}
                     <td>{item.field}</td>

                  <td>{item.mentor}</td>

                  <td>
                    <div className="progress-container">
                      <div
                        className={`custom-progress-bar ${isFull ? "full" : ""}`}
                        style={{
                          width: `${(item.registered / 5) * 100}%`,
                        }}
                      ></div>
                      <span>
                        {item.registered}/{MAX_CLASS}
                      </span>
                    </div>
                  </td>

                  <td>
                    <button
                      disabled={isFull}
                      onClick={() => handleRegister(item.id)}
                      className={isFull ? "btn-full" : "btn-primary"}
                    >
                      {isFull ? "Đã đủ lớp" : "Đăng ký học"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="table-footer">
          <span>
            Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
            {Math.min(currentPage * PAGE_SIZE, filteredData.length)} trong số{" "}
            {filteredData.length} lớp học
          </span>

          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? "active-page" : ""}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}