#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Paper-to-GDrive Test Runner${NC}"
echo "=============================="

# Check if conda is available
if command -v conda &> /dev/null; then
    echo -e "${GREEN}✓${NC} Conda is installed"
    
    # Initialize conda in the current shell if needed
    echo "Initializing conda for the current shell..."
    conda init bash

    # Check if a test environment already exists
    if conda env list | grep -q "paper-tests"; then
        echo -e "${GREEN}✓${NC} Test environment 'paper-tests' already exists"
    else
        echo "Creating conda environment for testing..."
        conda create -y -n paper-tests nodejs=18
        echo -e "${GREEN}✓${NC} Created conda environment 'paper-tests'"
    fi
    
    # Activate the environment
    echo "Activating conda environment 'paper-tests'..."
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate paper-tests
    
    echo -e "${GREEN}✓${NC} Activated environment: $(node --version)"
else
    echo -e "${YELLOW}!${NC} Conda not found. Proceeding with system Node.js"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗${NC} Node.js is not installed. Please install Node.js to run tests."
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Using Node.js $(node --version)"
fi

# Check if package.json has the required testing dependencies
if ! grep -q '"jest"' package.json 2>/dev/null; then
    echo "Adding Jest and necessary testing dependencies..."
    
    # Create temporary package.json if it doesn't exist
    if [ ! -f package.json ]; then
        echo '{"name":"paper-to-gdrive-tests","version":"1.0.0","private":true}' > package.json
    fi
    
    # Install Jest
    npm install --save-dev jest @babel/preset-env babel-jest
    
    # Add test script to package.json if not already present
    if ! grep -q '"test"' package.json; then
        # Use node to modify package.json
        node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('package.json'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.test = 'jest';
            pkg.jest = {
                testEnvironment: 'node',
                moduleFileExtensions: ['js'],
                transform: {
                    '^.+\\.js$': 'babel-jest'
                }
            };
            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
    fi
    
    # Create babel config if it doesn't exist
    if [ ! -f babel.config.js ]; then
        echo "module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};" > babel.config.js
    fi
    
    echo -e "${GREEN}✓${NC} Test dependencies installed"
else
    echo -e "${GREEN}✓${NC} Jest already configured in package.json"
fi

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Run the tests
echo -e "\n${YELLOW}Running tests...${NC}"
echo "=============================="

# Check if specific tests were specified
if [ $# -gt 0 ]; then
    echo "Running specified tests: $@"
    npx jest $@
else
    echo "Running all tests in the tests directory"
    npx jest tests/
fi

# Get the exit code from Jest
TEST_RESULT=$?

# Print results
echo -e "\n=============================="
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
fi

# If using conda, provide instructions to deactivate
if command -v conda &> /dev/null && conda env list | grep -q "paper-tests"; then
    echo -e "\nTo deactivate the test environment, run: ${YELLOW}conda deactivate${NC}"
fi

exit $TEST_RESULT 