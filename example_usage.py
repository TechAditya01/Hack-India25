from agno_solidity_generator import AgnoSolidityGenerator
from textwrap import dedent
import os

def main():
    # Initialize the code generator
    generator = AgnoSolidityGenerator()
    
    # Example contract description
    contract_description = dedent("""
    Create a simple ERC20 token contract with the following features:
    - Name: "MyToken"
    - Symbol: "MTK"
    - Initial supply: 1,000,000 tokens
    - Include standard ERC20 functions
    - Add a function to mint new tokens (only owner can call)
    - Include proper access control
    - Add events for important operations
    - Use OpenZeppelin contracts
    - Include NatSpec documentation
    """)
    
    # Generate the contract
    print("Generating contract...")
    result = generator.generate_contract(contract_description, "MyToken")
    
    if result["status"] == "success":
        print("\nGenerated Solidity Code:")
        print("-" * 50)
        print(result["code"])
        print("-" * 50)
        
        # Validate the generated code
        validation = generator.validate_code(result["code"])
        print("\nValidation Results:")
        print(f"Status: {validation['status']}")
        print(f"Is Valid: {validation['is_valid']}")
        if validation['warnings']:
            print("\nWarnings:")
            for warning in validation['warnings']:
                print(f"- {warning}")
        if validation['suggestions']:
            print("\nSuggestions:")
            for suggestion in validation['suggestions']:
                print(f"- {suggestion}")
        
        # Generate test file
        print("\nGenerating test file...")
        test_code = generator.generate_test_file("MyToken", result["code"])
        if test_code:
            test_filepath = os.path.join(generator.output_dir, f"MyToken_test_{result['metadata']['timestamp']}.js")
            with open(test_filepath, 'w') as f:
                f.write(test_code)
            print(f"Test file generated: {test_filepath}")
        
        # Generate deployment script
        print("\nGenerating deployment script...")
        deploy_code = generator.generate_deployment_script("MyToken", result["code"])
        if deploy_code:
            deploy_filepath = os.path.join(generator.output_dir, f"MyToken_deploy_{result['metadata']['timestamp']}.js")
            with open(deploy_filepath, 'w') as f:
                f.write(deploy_code)
            print(f"Deployment script generated: {deploy_filepath}")
        
        print("\nAll files have been generated in the 'generated_contracts' directory.")
    else:
        print(f"Error generating contract: {result['error']}")

if __name__ == "__main__":
    main() 