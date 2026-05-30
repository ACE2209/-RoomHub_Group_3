# .env (BE_RoomHub)

PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/
DATABASE_NAME=boarding_house
JWT_SECRET=roomhub_secret
JWT_EXPIRE=1d
// tham khảo chổ này
CLIENT_URL=http://localhost:3001

# Code up git

git init
git add .
git remote add origin https://github.com/ACE2209/-RoomHub_Group_3.git
git branch -M main
git commit -m "first commit"
git push -u origin main

feat Thêm tính năng mới
=> feat(cart): add shopping cart checkout
fix Sửa lỗi
=> fix(api): handle null response error
docs Chỉ thay đổi tài liệu (README, comment code, v.v.)
=> docs(readme): update installation guide
style Thay đổi định dạng code (không ảnh hưởng logic)
=> style(css): format with prettier
refactor Tái cấu trúc code (không thêm tính năng, không sửa lỗi)
=> refactor(auth): simplify login logic
test Thêm hoặc sửa test case
=> test(unit): add tests for user model
chore Các thay đổi linh tinh (cập nhật dependency, config, v.v.)
=> chore(deps): update lodash to v4.17.21
perf Cải thiện hiệu suất
=> perf(db): optimize query performance
ci Thay đổi cấu hình CI/CD
=> ci(github): add linting to workflow
build Thay đổi liên quan đến build (webpack, npm scripts, v.v.)
=> build(webpack): add production config
