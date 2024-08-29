import sys

def main():
    # The selected airport codes will be passed as command-line arguments
    selected_codes = sys.argv[1:]
    
    processed_codes = []

    for code in selected_codes:
        processed_codes.append(code)

    # Return the processed_codes list
    return processed_codes

if __name__ == "__main__":
    processed_codes_array = main()

print(processed_codes_array)