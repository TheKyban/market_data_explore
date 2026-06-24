# Market Data Explorer — Assignment Reflection

## 1. What concepts or technologies did you already know before starting the project?
Before starting this project, I had a solid foundation in full-stack web development. I was comfortable building user interfaces with **React** and **Next.js**, styling them with **Tailwind CSS**, and creating basic REST APIs using **Node.js/Express** and **Python (FastAPI)**. I also had experience with containerizing multi-tier applications using **Docker** and **Docker Compose**.

## 2. What new concepts did you learn while working on it?
This project introduced me to several highly specific, performance-critical concepts:
*   **The Feather Format & PyArrow:** I learned how incredibly fast the `.feather` format (based on Apache Arrow) is for reading and writing data frames compared to traditional CSVs. 
*   **Streaming Proxy Architecture:** I learned how to build a highly memory-efficient API Gateway using `http-proxy-middleware`. By avoiding global body parsers (`express.json()`), I learned how to stream raw TCP byte streams directly from the frontend to the Python backend without buffering the payload in Node.js RAM.
*   **Vectorized Pandas Operations:** I learned that iterating over rows in Pandas using `.apply()` is an anti-pattern. I learned how to use native vectorized operations (like `pd.to_datetime(df["expiry"]).dt.date` and NumPy's `np.column_stack`) to exponentially speed up data filtering.

## 3. What challenges did you face and how did you overcome them?
**Challenge 1: Out-of-Memory (OOM) Errors on Large File Uploads**
Initially, the Node.js API Gateway used `axios` and `multer.memoryStorage()` to handle file uploads. When uploading large `.feather` files, Node.js buffered the entire file into RAM before forwarding it to Python. This caused massive memory spikes and potential crashes. 
*   **Solution:** I refactored the API Gateway to use `http-proxy-middleware`. This allowed the gateway to stream the upload chunk-by-chunk directly to the Python service via raw sockets, completely eliminating the RAM overhead.

**Challenge 2: Slow Filtering Performance**
Initially, applying filters (especially date parsing for expiries and global text search) caused significant latency because the Python service was iterating over rows.
*   **Solution:** I rewrote the endpoints to use Dependency Injection (`Depends`) for cleaner state management, and replaced the loops with vectorized Pandas and NumPy logic. Grouping metadata (like unique strikes and expiries) was also optimized using `df.groupby()` rather than repeated boolean indexing.

## 4. What assumptions did you make about the dataset?
*   **Schema Consistency:** I assumed that every uploaded `.feather` file conforms to a strict schema containing at least: `instrument_type`, `expiry`, `strike`, and `name`. 
*   **Futures Pricing:** I assumed that Futures (`FUT`) contracts do not have a meaningful strike price (often represented as `0.0`), so I built logic to filter out `0.0` strikes when the `FUT` instrument type is selected.
*   **Memory Constraints:** I assumed that the dataset, while large, is small enough to fit entirely into the RAM of the Python container. The current architecture loads the active DataFrame completely into memory (`_current_df`).

## 5. If you had more time, what improvements would you make?
If I had more time, I would focus heavily on **scalability and memory efficiency** by shifting the architectural approach:

*   **Adopt DuckDB:** Keeping the entire dataset in Pandas memory is great for fast analytics, but it does not scale well if the dataset grows to tens of gigabytes or if multiple users upload different files concurrently. I would migrate the backend to use **DuckDB**. DuckDB is incredibly effective for analytical workloads and can query `.feather` and `.parquet` files *directly on disk* using SQL, with near-zero RAM overhead. This is a massive architectural trade-off that favors horizontal scalability over pure in-memory compute.
*   **Distributed Storage:** Currently, files are stored locally in the `/uploads` directory of the Python container. In a production environment, this prevents horizontal scaling. I would replace this with a blob storage solution (like AWS S3) and store file metadata in PostgreSQL.
*   **Frontend Virtualization:** On the frontend, if the user requests a page size of thousands of rows, the DOM will struggle to render. I would implement infinite scrolling or row virtualization to ensure the UI remains snappy regardless of the data size.
