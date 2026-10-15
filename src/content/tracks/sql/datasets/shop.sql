-- The online shop used throughout the SQL course
CREATE TABLE categories (
  id        integer PRIMARY KEY,
  name      text NOT NULL UNIQUE,
  parent_id integer REFERENCES categories (id)
);

INSERT INTO categories (id, name, parent_id) VALUES
  (1, 'Electronics', NULL),
  (2, 'Computers', 1),
  (3, 'Audio', 1),
  (4, 'Home', NULL),
  (5, 'Kitchen', 4),
  (6, 'Furniture', 4),
  (7, 'Books', NULL);

CREATE TABLE products (
  id          integer PRIMARY KEY,
  name        text NOT NULL,
  category_id integer REFERENCES categories (id),
  price       numeric(10, 2) NOT NULL CHECK (price >= 0),
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  added_on    date NOT NULL
);

INSERT INTO products (id, name, category_id, price, stock, added_on) VALUES
  (1, 'Laptop Pro 14', 2, 1299.00, 8, '2025-09-01'),
  (2, 'Wireless Mouse', 2, 24.99, 120, '2025-03-15'),
  (3, 'Mechanical Keyboard', 2, 89.50, 40, '2025-05-20'),
  (4, '27-inch Monitor', 2, 279.00, 15, '2025-07-11'),
  (5, 'Noise-Cancelling Headphones', 3, 199.00, 25, '2025-10-02'),
  (6, 'Bluetooth Speaker', 3, 59.90, 0, '2025-02-28'),
  (7, 'Chef''s Knife', 5, 45.00, 30, '2025-01-10'),
  (8, 'Espresso Machine', 5, 349.00, 6, '2025-11-05'),
  (9, 'French Press', 5, 29.95, 50, '2025-04-18'),
  (10, 'Standing Desk', 6, 499.00, 4, '2025-08-22'),
  (11, 'Office Chair', 6, 229.00, 12, '2025-06-30'),
  (12, 'Bookshelf', 6, 119.00, 0, '2025-12-01'),
  (13, 'SQL in Practice', 7, 39.99, 60, '2026-01-15'),
  (14, 'The Pragmatic Programmer', 7, 44.95, 35, '2025-03-01'),
  (15, 'Gift Card', NULL, 50.00, 999, '2025-01-01');

CREATE TABLE customers (
  id        integer PRIMARY KEY,
  name      text NOT NULL,
  email     text UNIQUE,
  city      text,
  country   char(2) NOT NULL,
  joined_on date NOT NULL
);

INSERT INTO customers (id, name, email, city, country, joined_on) VALUES
  (1, 'Ada Lovelace', 'ada@example.com', 'London', 'UK', '2025-01-12'),
  (2, 'Grace Hopper', 'grace@example.com', 'New York', 'US', '2025-02-03'),
  (3, 'Alan Turing', 'alan@example.com', 'Manchester', 'UK', '2025-02-20'),
  (4, 'Margaret Hamilton', 'margaret@example.com', 'Boston', 'US', '2025-04-08'),
  (5, 'Linus Torvalds', NULL, 'Portland', 'US', '2025-05-17'),
  (6, 'Katherine Johnson', 'katherine@example.com', 'Hampton', 'US', '2025-06-01'),
  (7, 'Tim Berners-Lee', 'tim@example.com', 'London', 'UK', '2025-07-23'),
  (8, 'Barbara Liskov', 'barbara@example.com', 'Boston', 'US', '2025-09-09'),
  (9, 'Edsger Dijkstra', 'edsger@example.com', 'Amsterdam', 'NL', '2025-10-30'),
  (10, 'Hedy Lamarr', NULL, 'Vienna', 'AT', '2025-11-14'),
  (11, 'Radia Perlman', 'radia@example.com', NULL, 'US', '2026-01-05'),
  (12, 'Guido van Rossum', 'guido@example.com', 'Amsterdam', 'NL', '2026-02-11');

CREATE TABLE orders (
  id          integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (id),
  ordered_at  timestamp NOT NULL,
  status      text NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  shipping    numeric(6, 2) NOT NULL DEFAULT 0
);

INSERT INTO orders (id, customer_id, ordered_at, status, shipping) VALUES
  (1, 1, '2025-03-02 10:15', 'delivered', 4.99),
  (2, 2, '2025-03-18 14:40', 'delivered', 0),
  (3, 1, '2025-04-05 09:05', 'delivered', 4.99),
  (4, 3, '2025-05-21 16:30', 'delivered', 4.99),
  (5, 4, '2025-06-11 11:00', 'delivered', 0),
  (6, 2, '2025-07-04 19:20', 'cancelled', 4.99),
  (7, 6, '2025-07-30 08:45', 'delivered', 4.99),
  (8, 7, '2025-08-14 13:10', 'delivered', 0),
  (9, 3, '2025-09-02 17:55', 'delivered', 4.99),
  (10, 8, '2025-09-28 10:30', 'delivered', 0),
  (11, 5, '2025-10-12 21:05', 'shipped', 4.99),
  (12, 1, '2025-11-20 12:00', 'shipped', 0),
  (13, 9, '2025-12-03 15:45', 'delivered', 4.99),
  (14, 4, '2025-12-15 10:10', 'delivered', 4.99),
  (15, 2, '2026-01-08 09:30', 'paid', 0),
  (16, 7, '2026-01-20 18:00', 'paid', 4.99),
  (17, 11, '2026-02-02 14:25', 'pending', 4.99),
  (18, 6, '2026-02-14 11:11', 'paid', 0),
  (19, 8, '2026-03-01 16:40', 'pending', 4.99),
  (20, 3, '2026-03-05 10:00', 'cancelled', 0);

CREATE TABLE order_items (
  order_id   integer NOT NULL REFERENCES orders (id),
  product_id integer NOT NULL REFERENCES products (id),
  quantity   integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 2, 1, 24.99), (1, 3, 1, 89.50),
  (2, 1, 1, 1299.00),
  (3, 14, 1, 44.95), (3, 9, 1, 29.95),
  (4, 5, 1, 199.00),
  (5, 10, 1, 499.00), (5, 11, 1, 229.00),
  (6, 6, 2, 59.90),
  (7, 7, 1, 45.00), (7, 9, 2, 29.95),
  (8, 4, 2, 279.00),
  (9, 2, 2, 24.99), (9, 14, 1, 44.95),
  (10, 1, 1, 1249.00), (10, 2, 1, 24.99),
  (11, 3, 1, 89.50),
  (12, 8, 1, 349.00),
  (13, 5, 1, 189.00), (13, 6, 1, 59.90),
  (14, 12, 1, 119.00),
  (15, 11, 2, 229.00),
  (16, 13, 3, 39.99),
  (17, 15, 1, 50.00),
  (18, 4, 1, 279.00), (18, 3, 1, 89.50),
  (19, 9, 1, 29.95),
  (20, 10, 1, 499.00);

CREATE TABLE reviews (
  id          integer PRIMARY KEY,
  product_id  integer NOT NULL REFERENCES products (id),
  customer_id integer NOT NULL REFERENCES customers (id),
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_on  date NOT NULL
);

INSERT INTO reviews (id, product_id, customer_id, rating, comment, created_on) VALUES
  (1, 1, 2, 5, 'Fast and light', '2025-04-01'),
  (2, 1, 8, 4, NULL, '2025-10-15'),
  (3, 2, 1, 4, 'Does the job', '2025-03-20'),
  (4, 2, 3, 3, 'Scroll wheel is noisy', '2025-09-20'),
  (5, 3, 5, 5, 'Lovely to type on', '2025-10-25'),
  (6, 5, 3, 5, 'Silence at last', '2025-06-02'),
  (7, 5, 9, 4, NULL, '2025-12-20'),
  (8, 8, 1, 2, 'Leaks a little', '2025-12-01'),
  (9, 10, 4, 5, 'My back thanks me', '2025-07-01'),
  (10, 14, 1, 5, 'A classic', '2025-04-20'),
  (11, 4, 7, 4, 'Great colours', '2025-08-30'),
  (12, 9, 6, 3, NULL, '2025-08-10');
