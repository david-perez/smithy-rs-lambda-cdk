use aws_smithy_http_server::routing::LambdaHandler;
use simple_service_server_sdk::{input, output, SimpleService};
use tracing_subscriber::{prelude::*, EnvFilter};

/// Setup `tracing::subscriber` to read the log level from RUST_LOG environment variable.
fn setup_tracing() {
    let format = tracing_subscriber::fmt::layer().json();
    let filter = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new("debug"))
        .unwrap();
    tracing_subscriber::registry()
        .with(format)
        .with(filter)
        .init();
    tracing::info!("tracing set up correctly");
}

#[tokio::main]
async fn main() {
    setup_tracing();
    tracing::info!("main start");

    let app = SimpleService::builder_without_plugins()
        .operation(operation)
        .build_unchecked();

    let handler = LambdaHandler::new(app);
    let lambda = lambda_http::run(handler);

    if let Err(err) = lambda.await {
        eprintln!("lambda error: {}", err);
    }
}

async fn operation(_input: input::OperationInput) -> output::OperationOutput {
    tracing::debug!("operation called");
    output::OperationOutput {
        message: Some("Hello world".to_owned()),
    }
}
