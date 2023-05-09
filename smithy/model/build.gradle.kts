val smithyVersion: String by project

buildscript {
    repositories { mavenLocal() }

    val smithyVersion: String by project
    val serverCodegenVersion: String by project
    dependencies {
        classpath("software.amazon.smithy.rust.codegen.server.smithy:codegen-server:$serverCodegenVersion")
        classpath("software.amazon.smithy:smithy-openapi:$smithyVersion")
    }
}

plugins { id("software.amazon.smithy") }

dependencies {
    implementation("software.amazon.smithy:smithy-aws-traits:$smithyVersion")
    implementation("software.amazon.smithy:smithy-model:$smithyVersion")
    implementation("software.amazon.smithy:smithy-aws-apigateway-traits:$smithyVersion")
    implementation("software.amazon.smithy:smithy-aws-apigateway-openapi:$smithyVersion")
}

smithy { outputDirectory = buildDir.resolve("codegen") }

tasks {
    val srcDir = projectDir.resolve("../")
    val serverSdkCrateName: String by project
    val copyServerCrate =
            create<Copy>("copyServerCrate") {
                from("$buildDir/codegen/$serverSdkCrateName/rust-server-codegen")
                into("$srcDir/$serverSdkCrateName")
            }

    val generateWorkspace = create<Task>("generateWorkspace")

    getByName("assemble").dependsOn("smithyBuildJar")
    getByName("assemble").finalizedBy(copyServerCrate, generateWorkspace)
}
