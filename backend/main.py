from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
import json
import os
from datetime import datetime

app = FastAPI(title="Formula Builder API",
             description="API for drug pricing calculations and formula management",
             version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data storage (in-memory for development)
formulas = {}
calculation_history = []
uploaded_data = []  # Store uploaded data
data_validation_summary = {}  # Store validation summary

class Formula(BaseModel):
    name: str
    description: str
    formula_string: str
    created_at: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Basic Discount",
                "description": "Calculates price after basic discount",
                "formula_string": "Total Sales * (1 - (Discount Percentage / 100))"
            }
        }

class CalculationRequest(BaseModel):
    formula_id: str
    data: List[Dict]
    filters: Optional[Dict] = None

@app.get("/")
async def root():
    return {"message": "Formula Builder API is running"}

@app.get("/api/data")
async def get_uploaded_data():
    """Retrieve the currently uploaded data"""
    return {
        "data": uploaded_data,
        "validation_summary": data_validation_summary
    }

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV, XLS, or XLSX file.")
    
    try:
        print(f"Processing file: {file.filename}")
        # Read the file content into memory
        contents = await file.read()
        print(f"File size: {len(contents)} bytes")
        
        # Create a pandas DataFrame
        try:
            if file.filename.endswith('.csv'):
                df = pd.read_csv(pd.io.common.BytesIO(contents))
            else:
                df = pd.read_excel(pd.io.common.BytesIO(contents))
            
            print(f"DataFrame shape: {df.shape}")
            print(f"Columns found: {df.columns.tolist()}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
        
        # Map the columns to match frontend expectations
        column_mapping = {
            'Drug Name': 'Product',
            'Manufacturer': 'Manufacturer',
            'Sales Year': 'Date',
            'Customer Category': 'Customer',
            'Sales Region': 'Transaction Type',
            'Total Sales (USD)': 'Price',
            'Discount Percentage (%)': 'Discount',
            'Pricing Compliance Status': 'Status',
            'Regulatory Price Limit (USD)': 'Regulatory Limit',
            'Effective Price After Discounts (USD)': 'Effective Price'
        }
        
        # Check for required columns with more informative error
        required_columns = [
            'Drug Name', 'Manufacturer', 'Sales Year', 'Customer Category',
            'Sales Region', 'Total Sales (USD)', 'Discount Percentage (%)',
            'Pricing Compliance Status'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            available_columns = df.columns.tolist()
            error_message = (
                f"Missing required columns: {', '.join(missing_columns)}\n"
                f"Available columns in file: {', '.join(available_columns)}"
            )
            raise HTTPException(status_code=400, detail=error_message)
        
        # Rename columns to match frontend expectations
        df = df.rename(columns=column_mapping)
        
        # Perform data validation
        validation_summary = {
            "missing_discounts": len(df[df["Discount"].isna()]),
            "govt_transactions": len(df[df["Customer"] == "Government"]),
            "duplicate_transactions": len(df[df.duplicated()])
        }
        
        # Process the data to match frontend structure
        processed_data = []
        for _, row in df.iterrows():
            try:
                processed_row = {
                    "Date": str(row["Date"]),  # Sales Year
                    "Product": str(row["Product"]),  # Drug Name
                    "Customer": str(row["Customer"]),  # Customer Category
                    "Transaction Type": str(row["Transaction Type"]),  # Sales Region
                    "Quantity": 1,  # Default quantity since it's not in the dataset
                    "Price": float(row["Price"]) if pd.notnull(row["Price"]) else 0.0,  # Total Sales
                    "Discount": str(row["Discount"]) if pd.notnull(row["Discount"]) else "--",  # Discount Percentage
                    "Status": str(row["Status"]),  # Pricing Compliance Status
                    "Manufacturer": str(row["Manufacturer"]),
                    "Regulatory Limit": float(row["Regulatory Limit"]) if pd.notnull(row["Regulatory Limit"]) else 0.0,
                    "Effective Price": float(row["Effective Price"]) if pd.notnull(row["Effective Price"]) else 0.0
                }
                processed_data.append(processed_row)
            except Exception as e:
                print(f"Error processing row: {row}")
                print(f"Error details: {str(e)}")
                continue
        
        if not processed_data:
            raise HTTPException(status_code=400, detail="No valid data could be processed from the file")
        
        # Store the processed data and validation summary
        global uploaded_data, data_validation_summary
        uploaded_data = processed_data
        data_validation_summary = validation_summary
        
        print(f"Successfully processed {len(processed_data)} rows")
        return {
            "message": "File processed successfully",
            "rows": len(processed_data),
            "data": processed_data,
            "validation_summary": validation_summary
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/formulas")
async def create_formula(formula: Formula):
    formula_id = str(len(formulas) + 1)
    formula.created_at = datetime.now().isoformat()
    formula_dict = formula.model_dump()
    formulas[formula_id] = formula_dict
    return {"id": formula_id, **formula_dict}

@app.get("/api/formulas")
async def get_formulas():
    return formulas

@app.post("/api/calculate")
async def calculate_prices(request: CalculationRequest):
    if request.formula_id not in formulas:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    try:
        # Get the formula
        formula = formulas[request.formula_id]
        formula_string = formula["formula_string"]
        
        # Process each row with the formula
        results = []
        for row in request.data:
            try:
                # Extract values needed for calculation
                total_sales = float(row["Price"]) if row["Price"] else 0.0  # Total Sales (USD)
                discount_percentage = float(row["Discount"]) if row["Discount"] != "--" else 0.0
                regulatory_limit = float(row["Regulatory Limit"]) if row["Regulatory Limit"] else 0.0
                
                # Calculate effective price using the formula
                effective_price = total_sales * (1 - (discount_percentage / 100))
                
                # Determine compliance status
                compliance_status = "Compliant" if effective_price <= regulatory_limit else "Non-Compliant"
                
                # Create result row with all original data plus calculations
                result_row = {
                    "Product": row["Product"],
                    "Price": total_sales,
                    "Calculated Price": effective_price,
                    "Regulatory Limit": regulatory_limit,
                    "Discount": row["Discount"],
                    "Compliance Status": compliance_status,
                    "Formula Used": formula_string
                }
                results.append(result_row)
                print(f"Processed row: {result_row}")  # Debug log
            except Exception as e:
                print(f"Error processing row: {row}")
                print(f"Error details: {str(e)}")
                continue
        
        if not results:
            raise HTTPException(status_code=400, detail="No calculations could be performed")
        
        # Store calculation in history
        calculation_history.append({
            "timestamp": datetime.now().isoformat(),
            "formula_id": request.formula_id,
            "formula_name": formula["name"],
            "rows_processed": len(results),
            "compliant_count": sum(1 for r in results if r["Compliance Status"] == "Compliant"),
            "non_compliant_count": sum(1 for r in results if r["Compliance Status"] == "Non-Compliant")
        })
        
        return {
            "results": results,
            "summary": {
                "total_processed": len(results),
                "compliant_count": sum(1 for r in results if r["Compliance Status"] == "Compliant"),
                "non_compliant_count": sum(1 for r in results if r["Compliance Status"] == "Non-Compliant"),
                "formula_used": formula_string,
                "formula_name": formula["name"]
            }
        }
    
    except Exception as e:
        print(f"Calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error performing calculations: {str(e)}")

@app.get("/api/reports")
async def get_reports(start_date: Optional[str] = None, end_date: Optional[str] = None):
    return {
        "calculations": calculation_history,
        "summary": {
            "total_calculations": len(calculation_history),
            "latest_calculation": calculation_history[-1] if calculation_history else None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 