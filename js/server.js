const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

const app = express();
app.use(express.json());
app.use(cors());

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); // .은 경로

const config = {
  user: 'SYSTEM',
  password: 'test1234',
  connectString: 'localhost:1521/xe'
};

// Oracle 데이터베이스와 연결을 유지하기 위한 전역 변수
let connection;

// 데이터베이스 연결 설정
async function initializeDatabase() {
  try {
    connection = await oracledb.getConnection(config);
    console.log('Successfully connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle database', err);
  }
}

initializeDatabase();

// 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello World');
});

////////////////////////////////////////////
/* withNode01.html */
// 검색 (학년 분류)
app.get('/list', async (req, res) => {
  const { keyword, grade } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM STUDENT WHERE (STU_NAME LIKE '%${keyword}%' 
      OR STU_NO LIKE '%${keyword}%' OR STU_DEPT LIKE '%${keyword}%') AND STU_GRADE LIKE '%${grade}%'`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index]; 
      });
      return obj;
    });

    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});


/* withNode02.html */
// 수정 및 저장
app.get('/update', async (req, res) => {
  const { stuName, stuDept, stuGrade, stuGender, stuNo } = req.query;
  try {
    var query = `UPDATE STUDENT 
        SET STU_NAME = '${stuName}', 
        STU_DEPT = '${stuDept}', 
        STU_GRADE = '${stuGrade}', 
        STU_GENDER = '${stuGender}'
        WHERE STU_NO = '${stuNo}'`
    const result = await connection.execute( query, [], { autoCommit : true } );

    res.json([{message : "수정되었습니다!"}]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

// 삭제
app.get('/delete', async (req, res) => {
  const { stuNo } = req.query;
  console.log(stuNo);
  try {
    const result = await connection.execute(
      `DELETE FROM STUDENT WHERE STU_NO IN (${stuNo})`, [], { autoCommit : true }
    );

    // res.status(201).send("삭제되었습니다!");
    res.json([{message : "삭제되었습니다!"}]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});


/* withNode03.html */
app.get('/qwer', async (req, res) => {
  const { stuNo, stuGrade } = req.query;
  var query = `UPDATE STUDENT SET STU_GRADE = ${stuGrade} WHERE STU_NO = ${stuNo}`;
  await connection.execute(query, [], { autoCommit : true });

  // res.send('Hello World');
});

// 학번받아서 삭제 (예시)
app.get('/remove', async (req, res) => {
  const { stuNo } = req.query;
  var query = `DELETE FROM STUDENT WHERE STU_NO = ${stuNo}`;
  await connection.execute(query, [], { autoCommit : true });
  res.json({message : "삭제완료!"});
});


/* 20240730.html */
// 제출 (20240730.html)
app.get('/submit', async (req, res) => {  // type: "GET"
  const { stuNo, stuName, stuDept, stuGrade, stuGender } = req.query;
  var query = `INSERT INTO STUDENT VALUES (${stuNo}, '${stuName}', '${stuDept}', ${stuGrade}, null, '${stuGender}', null, null)`;
  await connection.execute(query, [], { autoCommit : true });
  res.json({message : "학생 정보를 새로 추가하였습니다."});
});


////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
/* insert-20240730.html */
// type: "POST"
app.post('/insert', async (req, res) => {   
  var { stuNo, stuName, stuDept, stuGrade, stuGender } = req.body;  // 보안 문제로 body에 담겨서 전송
  var query 
  = `INSERT INTO STUDENT(STU_NO, STU_NAME, STU_DEPT, STU_GRADE, STU_GENDER) 
  VALUES ('${stuNo}', '${stuName}', '${stuDept}', '${stuGrade}', '${stuGender}')`;
  await connection.execute(query, [], { autoCommit : true });
  res.json({message : "학생 정보를 새로 추가하였습니다."});
});


// 제출 (insert-20240730.html)
app.get('/idcheck', async (req, res) => {   // type: "GET"
  var { stuNo } = req.query; 
  var query 
  = `SELECT COUNT(*) AS CNT FROM STUDENT WHERE STU_NO = '${stuNo}'`;
  await connection.execute(query, [], { autoCommit : true });
  console.log(query);
  res.json({message : "중복체크"});
});


/* login.html */
// 로그인
app.post('/login', async (req, res) => {
  var {id, pwd} = req.body;
  var query = `SELECT COUNT(*) AS CNT FROM MEMBER WHERE ID = '${id}' AND PWD = '${pwd}'`;
  var result = await connection.execute(query);
  const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
  const rows = result.rows.map(row => {
    // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
    const obj = {};
    columnNames.forEach((columnName, index) => {
      obj[columnName] = row[index];
    });
    return obj;
  });
  res.json(rows);
});


/* memberjoin.html */
// localhost:3000/newmeber
app.post('/newmember', async (req, res) => {
  const {memId, memPwd, memName, memEmail, memPhone, memGender} = req.body;
  var query = `INSERT INTO MEMBER VALUES ('${memId}', '${memPwd}', '${memName}', '${memEmail}', '${memPhone}', '${memGender}')`;
  await connection.execute(query, [], { autoCommit : true });
  res.json({msg : "회원가입을 완료했습니다!"});
});

// localhost:3000/samecheck
app.post('/samecheck', async (req, res) => {
  const {memId} = req.body;
  console.log(memId);
  var query = `SELECT COUNT(*) AS CNT FROM MEMBER WHERE USERID = '${memId}'`;
  const result = await connection.execute(query, [], { autoCommit : true });
  console.log(query);
  console.log(result.rows);
  res.json({msg : "아이디 사용이 가능합니다."}); 
});


/* vuesample.html */
app.get('/stuDelete', async (req, res) => {
  var {stuNo} = req.query;
  var query = `DELETE FROM STUDENT WHERE STU_NO = ${stuNo}`;
  await connection.execute(query, [], {autoCommit : true});
  res.json({msg : "삭제완료!"});
});


/* withNode04.html */
app.post('/newinfo', async (request, response) => {
  var {stuNo, stuName, stuDept} = request.body;
  var query = `INSERT INTO STUDENT(STU_NO, STU_NAME, STU_DEPT) VALUES ('${stuNo}', '${stuName}', '${stuDept}')`;
  await connection.execute(query, [], { autoCommit : true});
  response.json({msg : "저장되었습니다!"});
});


////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
/* list-checkbox.html */
app.get('/list', async (req, res) => {
  const { keyword, grade, orderName, orderKind } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM STUDENT WHERE (STU_NAME LIKE '%${keyword}%' 
      OR STU_NO LIKE '%${keyword}%' OR STU_DEPT LIKE '%${keyword}%') AND STU_GRADE LIKE '%${grade}%'
      ORDER BY ${orderName} ${orderKind}`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index]; 
      });
      return obj;
    });

    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

app.get('/search', async (req, res) => {
  const { id } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM STUDENT WHERE STU_NO = '%${id}%'`);
    const columnNames = result.metaData.map(column => column.name);

    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});


// 서버 시작
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
