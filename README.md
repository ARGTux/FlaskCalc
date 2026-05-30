# Calc
### Description
	This is a simple Flask calculator app.

	This project provides a web-based scientific calculator built with Flask for the backend and a lightweight client-side UI for interactions. It combines a classic calculator layout with scientific features such as trigonometric functions, logarithms, powers, roots, complex number support, and a memory register. The interface supports common calculator symbols (π, ×, ÷, √, superscript exponents), automatic closing of parentheses, and keyboard input so it feels natural to type expressions directly. The angle mode can be switched between radians and degrees, and users can store and recall a single memory value.

	The app also includes a graphing view with multiple function inputs. Functions are checked live for validity and plotted using Plotly, with panning, zooming, and toggling available for each trace. Both a desktop scientific layout and a more compact mobile numpad layout are included so the app feels comfortable on different screen sizes.

	Most of the expression parsing and evaluation is handled client-side by math.js, while Flask mainly serves the templates and static assets. This keeps the project simple to run locally and easy to adapt or extend. It can work as a standalone calculator tool, a learning project, or something to embed inside a larger Flask application.

#### Video Demo: [Flask Calc showcase](https://youtu.be/1A48G1Pfj04)

## Notes
1. Install dependencies
	- pip install -r requirements.txt
2. Run the app
	- flask run --debug
