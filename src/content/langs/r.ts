import { lesson, langTrack } from './helpers';

export const r = langTrack({
  id: 'r',
  title: 'R',
  icon: '📈',
  color: '#276dc3',
  lang: 'r',
  blurb: 'The statistician\'s language: data analysis, visualisation and research. Used in science, finance and healthcare.',
  fields: ['Data analysis', 'Statistics', 'Research'],
  lessons: [
    lesson(
      'r-basics',
      'Hello, R: vectors',
      `
In R, almost everything is a **vector**. Operations apply to every element at once (**vectorization**):

~~~r
x <- c(4, 8, 15, 16, 23, 42)     # <- assigns; c() combines values
length(x)                         # 6
x * 2                             # 8 16 30 32 46 84
mean(x); median(x); sd(x)
x[2]                              # 8   (R is 1-indexed!)
x[x > 10]                         # 15 16 23 42  (logical filtering)
cat("Total:", sum(x), "\\n")
~~~

Use \`print()\` to show objects and \`cat()\` for plain text output.
`,
      {
        prompt: 'Create `temps <- c(18, 21, 25, 19, 30)`. Print `mean: 22.6`, then the temperatures above 20 joined by spaces using `cat`, then how many days were above 20.',
        starter: 'temps <- c(18, 21, 25, 19, 30)\n# your code\n',
        solution: 'temps <- c(18, 21, 25, 19, 30)\ncat("mean:", mean(temps), "\\n")\nhot <- temps[temps > 20]\ncat(hot, "\\n")\ncat(length(hot), "\\n")\n',
        expected: 'mean: 22.6\n21 25 30\n3',
        hints: ['cat("mean:", mean(temps), "\\n")', 'temps[temps > 20] filters with a logical vector.'],
      },
      [['R indexing', 'R vectors are 1-indexed: x[1] is the first element.']],
    ),
    lesson(
      'r-functions',
      'Functions & control flow',
      `
~~~r
bmi <- function(weight, height = 1.75) {
  weight / height^2                  # the last expression is returned
}

classify <- function(x) {
  if (x < 18.5) "under" else if (x < 25) "normal" else "over"
}

sapply(c(50, 70, 90), function(w) classify(bmi(w)))   # apply to each element
for (i in 1:3) cat(i, "")
ifelse(c(1, 5, 9) > 4, "big", "small")                  # vectorized if
~~~
`,
      {
        prompt: 'Write `grade <- function(score)` returning `"A"` (≥90), `"B"` (≥80), `"C"` (≥70) or `"F"`. Use `sapply` to grade `c(95, 82, 71, 50)` and print the grades separated by spaces with `cat`.',
        starter: 'grade <- function(score) {\n  "?"\n}\n\nscores <- c(95, 82, 71, 50)\n# your code\n',
        solution: 'grade <- function(score) {\n  if (score >= 90) "A" else if (score >= 80) "B" else if (score >= 70) "C" else "F"\n}\n\nscores <- c(95, 82, 71, 50)\ncat(sapply(scores, grade), "\\n")\n',
        expected: 'A B C F',
        hints: ['if (score >= 90) "A" else if … else "F"', 'cat(sapply(scores, grade), "\\n")'],
      },
      [['sapply', 'Applies a function to each element and simplifies the result to a vector.']],
    ),
    lesson(
      'r-dataframes',
      'Data frames',
      `
A **data frame** is a table: columns are vectors of equal length. It's R's core data structure:

~~~r
df <- data.frame(
  name  = c("Ada", "Linus", "Grace"),
  lang  = c("Python", "C", "COBOL"),
  score = c(92, 85, 78)
)
nrow(df); names(df)
df$score                        # a column
df[df$score > 80, ]             # rows where score > 80
df[order(-df$score), ]          # sort by score descending
mean(df$score)
~~~
`,
      {
        prompt: 'Build a data frame of `name` and `sales` (`Ana 120, Ben 95, Cara 180, Dan 60`). Print the names of people with sales above the mean, highest first, separated by spaces. Then print the mean.',
        starter: '# build the data frame and answer\n',
        solution: 'df <- data.frame(name = c("Ana", "Ben", "Cara", "Dan"), sales = c(120, 95, 180, 60))\navg <- mean(df$sales)\ntop <- df[df$sales > avg, ]\ntop <- top[order(-top$sales), ]\ncat(top$name, "\\n")\ncat(avg, "\\n")\n',
        expected: 'Cara Ana\n113.75',
        hints: ['df[df$sales > avg, ] filters rows.', 'top[order(-top$sales), ] sorts descending.'],
      },
      [['R data frame', 'A table where each column is a vector; df$col selects a column, df[rows, cols] subsets.']],
    ),
    lesson(
      'r-aggregate',
      'Grouping & summaries',
      `
Group-wise summaries are bread and butter for analysts:

~~~r
sales <- data.frame(
  region = c("N", "S", "N", "E", "S"),
  amount = c(100, 200, 50, 75, 25)
)
aggregate(amount ~ region, data = sales, FUN = sum)
tapply(sales$amount, sales$region, sum)        # named vector of sums
table(sales$region)                            # counts per category
~~~

In practice many analysts use the **tidyverse** (\`dplyr\`, \`ggplot2\`): \`sales |> group_by(region) |> summarise(total = sum(amount))\`.
`,
      {
        prompt: 'Using `tapply`, compute total `amount` per `team` and print each as `team: total`, sorted by total descending.',
        starter: 'd <- data.frame(\n  team = c("red", "blue", "red", "green", "blue", "red"),\n  amount = c(10, 30, 5, 20, 15, 25)\n)\n# your code\n',
        solution: 'd <- data.frame(\n  team = c("red", "blue", "red", "green", "blue", "red"),\n  amount = c(10, 30, 5, 20, 15, 25)\n)\ntotals <- sort(tapply(d$amount, d$team, sum), decreasing = TRUE)\nfor (t in names(totals)) cat(t, ": ", totals[[t]], "\\n", sep = "")\n',
        expected: 'blue: 45\nred: 40\ngreen: 20',
        hints: ['tapply(d$amount, d$team, sum) returns a named vector.', 'sort(…, decreasing = TRUE) then loop over names(totals).'],
      },
      [['tapply', 'Applies a function to subsets of a vector grouped by a factor: tapply(values, groups, FUN).']],
    ),
    lesson(
      'r-stats',
      'Statistics: correlation & regression',
      `
R was built for statistics:

~~~r
x <- c(1, 2, 3, 4, 5)
y <- c(2.1, 3.9, 6.2, 7.8, 10.1)
cor(x, y)                    # correlation coefficient (−1 … 1)
model <- lm(y ~ x)           # linear regression: y = intercept + slope * x
coef(model)                  # intercept and slope
predict(model, data.frame(x = 6))
summary(model)               # R², p-values, …
~~~

Correlation is not causation, but a strong \`cor\` tells you two variables move together.
`,
      {
        prompt: 'Fit `lm(score ~ hours)` on the given data. Print the slope and intercept rounded to 2 decimals as `slope: X` and `intercept: Y`, then the predicted score for 6 hours rounded to 1 decimal.',
        starter: 'hours <- c(1, 2, 3, 4, 5)\nscore <- c(52, 60, 67, 77, 84)\n# your code\n',
        solution: 'hours <- c(1, 2, 3, 4, 5)\nscore <- c(52, 60, 67, 77, 84)\nmodel <- lm(score ~ hours)\ncf <- coef(model)\ncat("slope:", round(cf[["hours"]], 2), "\\n")\ncat("intercept:", round(cf[["(Intercept)"]], 2), "\\n")\ncat(round(predict(model, data.frame(hours = 6)), 1), "\\n")\n',
        expected: 'slope: 8.1\nintercept: 43.7\n92.3',
        hints: ['model <- lm(score ~ hours); cf <- coef(model)', 'cf[["hours"]] is the slope; cf[["(Intercept)"]] the intercept.', 'predict(model, data.frame(hours = 6))'],
      },
      [['lm()', 'Fits a linear model, e.g. lm(y ~ x); coef() gives intercept and slope.']],
    ),
    lesson(
      'r-project',
      '🛠️ Mini project: Survey analysis',
      `
A realistic analyst task: clean data, summarise by group and report.
`,
      {
        prompt: 'Survey responses include `NA` ratings. Remove rows with `NA`, then print for each `product` (alphabetical) its mean rating with 1 decimal and the number of responses as `A: 4.3 (3)`.',
        starter: 'survey <- data.frame(\n  product = c("A", "B", "A", "B", "A", "C", "B"),\n  rating  = c(5, 3, 4, NA, 4, 2, 4)\n)\n# your code\n',
        solution: 'survey <- data.frame(\n  product = c("A", "B", "A", "B", "A", "C", "B"),\n  rating  = c(5, 3, 4, NA, 4, 2, 4)\n)\nclean <- survey[!is.na(survey$rating), ]\nfor (p in sort(unique(clean$product))) {\n  r <- clean$rating[clean$product == p]\n  cat(p, ": ", format(round(mean(r), 1), nsmall = 1), " (", length(r), ")\\n", sep = "")\n}\n',
        expected: 'A: 4.3 (3)\nB: 3.5 (2)\nC: 2.0 (1)',
        hints: ['survey[!is.na(survey$rating), ] drops missing ratings.', 'format(round(x, 1), nsmall = 1) always shows one decimal.'],
      },
      [],
      80,
    ),
  ],
});
