package dev.andrew.repetitobackend.common.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DatabaseMigrationConfig {

    @Bean(name = "flyway", initMethod = "migrate")
    public Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .load();
    }

    @Bean
    public static BeanFactoryPostProcessor entityManagerFactoryDependsOnFlyway() {
        return beanFactory -> addDependsOn(beanFactory, "entityManagerFactory", "flyway");
    }

    private static void addDependsOn(ConfigurableListableBeanFactory beanFactory, String beanName, String dependsOn) {
        if (beanFactory.containsBeanDefinition(beanName)) {
            beanFactory.getBeanDefinition(beanName).setDependsOn(dependsOn);
        }
    }
}
