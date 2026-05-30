from flask import Flask, render_template


def create_app() -> Flask:
    app = Flask(
        __name__,
        static_folder="static",
        template_folder="templates",
    )

    # Home  scientific calculator
    @app.route("/")
    def index():
        return render_template("index.html")

    # Graphing calculator
    @app.route("/graph")
    def graph():
        return render_template("graph.html")

    # Basic 404 handler so production does not spit a stack trace
    @app.errorhandler(404)
    def not_found(error):
        return render_template("404.html"), 404

    return app


# WSGI entry point
app = create_app()

if __name__ == "__main__":
    # You can flip debug to False for real deployment
    app.run(debug=True)
