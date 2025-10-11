import pandas as pd
import os

def split_csv_with_pandas(input_filepath, rows_per_file=2000):
    if not os.path.exists(input_filepath):
        print(f"Error: The file '{input_filepath}' was not found.")
        return

    output_dir = "split_output_files"
    os.makedirs(output_dir, exist_ok=True)
    print(f"Output files will be saved in the '{output_dir}' directory.")

    # This reads the CSV in chunks without loading the whole file into memory
    try:
        chunk_iterator = pd.read_csv(input_filepath, chunksize=rows_per_file)
        
        for i, chunk in enumerate(chunk_iterator):
            output_filename = os.path.join(output_dir, f"chunk_{i + 1}.csv")
        
            chunk.to_csv(output_filename, index=False)
            
            print(f"Generated {output_filename} with {len(chunk)} rows.")
            
        print("\nSuccessfully split the CSV file into multiple chunks.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    large_csv_path = "binary_combinations.csv" 
    num_rows_per_file = 2000
    
    split_csv_with_pandas(large_csv_path, num_rows_per_file)