import itertools
import pandas as pd

num_columns = 20

combinations = itertools.product([0, 1], repeat=num_columns)

chunk_size = 100000 
data_chunks = []

# Create column names
column_names = [f'Column_{i+1}' for i in range(num_columns)]

for i, combination in enumerate(combinations):
    data_chunks.append(combination)
    if (i + 1) % chunk_size == 0:
        print(f"Processed {i + 1} combinations...")

print("Creating DataFrame...")
df = pd.DataFrame(data_chunks, columns=column_names)

output_file = 'binary_combinations.csv'

print(f"Saving to {output_file}...")
df.to_csv(output_file, index=False)

print(f"Successfully generated all {len(df)} combinations in '{output_file}'!")