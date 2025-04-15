import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8f9fa;
    color: #333;
    line-height: 1.6;
  }

  button {
    cursor: pointer;
    border: none;
    padding: 10px 16px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 1rem;
    transition: all 0.2s ease-in-out;
    background-color: #4f85e5;
    color: white;
    margin-right: 10px;
    margin-bottom: 10px;

    &:hover {
      background-color: #3a6bc5;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  input, select, textarea {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    margin-bottom: 15px;
    background-color: white;
    width: 100%;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }
`; 