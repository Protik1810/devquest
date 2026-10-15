-- The company (people, departments and projects) used throughout the SQL course
CREATE TABLE departments (
  id     integer PRIMARY KEY,
  name   text NOT NULL UNIQUE,
  budget numeric(12, 2) NOT NULL
);

INSERT INTO departments (id, name, budget) VALUES
  (1, 'Engineering', 900000),
  (2, 'Sales', 400000),
  (3, 'Marketing', 250000),
  (4, 'Support', 150000),
  (5, 'Research', 300000);

CREATE TABLE employees (
  id            integer PRIMARY KEY,
  name          text NOT NULL,
  title         text NOT NULL,
  department_id integer REFERENCES departments (id),
  manager_id    integer REFERENCES employees (id),
  salary        numeric(10, 2) NOT NULL,
  hired_on      date NOT NULL,
  email         text UNIQUE
);

INSERT INTO employees (id, name, title, department_id, manager_id, salary, hired_on, email) VALUES
  (1, 'Maya Chen', 'CEO', NULL, NULL, 240000, '2018-03-01', 'maya@corp.example'),
  (2, 'Omar Haddad', 'CTO', 1, 1, 190000, '2018-06-15', 'omar@corp.example'),
  (3, 'Sofia Rossi', 'VP Sales', 2, 1, 165000, '2019-01-07', 'sofia@corp.example'),
  (4, 'Liam O''Brien', 'Engineering Manager', 1, 2, 150000, '2019-09-23', 'liam@corp.example'),
  (5, 'Priya Nair', 'Senior Engineer', 1, 4, 135000, '2020-02-10', 'priya@corp.example'),
  (6, 'Jonas Berg', 'Engineer', 1, 4, 105000, '2021-05-03', 'jonas@corp.example'),
  (7, 'Aisha Bello', 'Engineer', 1, 4, 98000, '2023-08-14', 'aisha@corp.example'),
  (8, 'Tom Novak', 'Sales Manager', 2, 3, 120000, '2020-04-20', 'tom@corp.example'),
  (9, 'Elena Petrova', 'Account Executive', 2, 8, 82000, '2022-01-17', 'elena@corp.example'),
  (10, 'Diego Alvarez', 'Account Executive', 2, 8, 79000, '2024-03-04', 'diego@corp.example'),
  (11, 'Hannah Kim', 'Marketing Lead', 3, 3, 110000, '2021-11-01', 'hannah@corp.example'),
  (12, 'Yuki Tanaka', 'Designer', 3, 11, 88000, '2023-02-27', 'yuki@corp.example'),
  (13, 'Sam Okafor', 'Support Engineer', 4, 2, 72000, '2022-07-11', 'sam@corp.example'),
  (14, 'Noah Fischer', 'Support Engineer', 4, 13, 68000, '2025-06-02', 'noah@corp.example'),
  (15, 'Lena Kowalski', 'Intern', 1, 5, 40000, '2026-01-12', NULL);

CREATE TABLE projects (
  id            integer PRIMARY KEY,
  name          text NOT NULL,
  department_id integer NOT NULL REFERENCES departments (id),
  starts_on     date NOT NULL,
  ends_on       date,
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

INSERT INTO projects (id, name, department_id, starts_on, ends_on) VALUES
  (1, 'Checkout redesign', 1, '2025-09-01', NULL),
  (2, 'Mobile app', 1, '2025-01-15', '2025-12-19'),
  (3, 'Spring campaign', 3, '2026-01-05', '2026-03-31'),
  (4, 'Support portal', 4, '2025-05-01', NULL),
  (5, 'Data warehouse', 1, '2026-02-01', NULL);

CREATE TABLE assignments (
  employee_id integer NOT NULL REFERENCES employees (id),
  project_id  integer NOT NULL REFERENCES projects (id),
  role        text NOT NULL,
  hours       integer NOT NULL CHECK (hours >= 0),
  PRIMARY KEY (employee_id, project_id)
);

INSERT INTO assignments (employee_id, project_id, role, hours) VALUES
  (5, 1, 'lead', 120),
  (6, 1, 'developer', 200),
  (7, 1, 'developer', 160),
  (12, 1, 'designer', 80),
  (4, 2, 'lead', 90),
  (5, 2, 'developer', 300),
  (6, 2, 'developer', 260),
  (11, 3, 'lead', 100),
  (12, 3, 'designer', 140),
  (9, 3, 'sales input', 20),
  (13, 4, 'lead', 150),
  (14, 4, 'support', 110),
  (7, 4, 'developer', 60);
