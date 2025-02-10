# Formula Builder Tool for Drug Pricing

A full-stack application that automates drug price calculations using dynamic formula configurations. The tool supports CSV uploads for sales data, performs real-time calculations based on user-defined or default formulas, and generates comprehensive dashboards and compliance reports.

## Features

- CSV/XLS file upload and validation
- Dynamic formula builder with drag-and-drop interface
- Real-time price calculations
- Compliance checking against regulatory limits
- Interactive dashboards and reports
- Data filtering and export capabilities

## Tech Stack

### Frontend
- Next.js with React
- CSS for styling
- Axios for API calls
- PapaParse for CSV parsing
- Chart.js/Recharts for data visualization

### Backend
- Python with FastAPI
- Local storage for data persistence
- CSV processing capabilities
- Formula computation engine

## Project Structure

```
formula-builder/
├── frontend/          # Next.js frontend application
├── backend/           # Python FastAPI backend
└── README.md         # Project documentation
```

## Setup Instructions

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

- `POST /api/upload` - Upload and validate CSV data
- `POST /api/calculate` - Execute price calculations
- `GET /api/formulas` - Retrieve saved formulas
- `POST /api/formulas` - Save new formula
- `GET /api/reports` - Generate compliance reports

## Data Format

Expected CSV columns:
- Drug Name
- Manufacturer
- Sales Year
- Total Sales (USD)
- Discount Percentage (%)
- Customer Category
- Sales Region
- Regulatory Price Limit (USD)
- Effective Price After Discounts (USD)
- Pricing Compliance Status

## License

MIT License 