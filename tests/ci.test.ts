import { GitActionTypes, MockGithub, Moctokit } from "@kie/mock-github";
import path from "path";
import { Act } from "@kie/act-js";

export const logActOutput = (logFile: string) =>
  process.env.ACT_LOG ? { logFile: path.join(process.cwd(), logFile) } : {};

let mockGithub: MockGithub;

beforeEach(async () => {
  mockGithub = new MockGithub(
    {
      repo: {
        hey: {
          pushedBranches: ["branch1", "main"],
          localBranches: ["branch3"],
          currentBranch: "main",
          files: [
            {
              src: path.resolve(__dirname, "..", ".github"),
              dest: ".github",
            },
            {
              src: path.resolve(__dirname, "..", "package.json"),
              dest: "package.json",
            },
            {
              src: path.resolve(__dirname, "..", "package-lock.json"),
              dest: "package-lock.json",
            },
            {
              src: path.resolve(__dirname, "..", "tsconfig.json"),
              dest: "tsconfig.json",
            },
            {
              src: path.resolve(__dirname, "..", "tests"),
              dest: "tests",
            },
          ],
          history: [
            {
              action: GitActionTypes.PUSH,
              branch: "branch1",
              files: [
                {
                  src: ".",
                  dest: ".",
                },
              ],
            },
            {
              action: GitActionTypes.MERGE,
              head: "branch1",
              base: "main",
            },
          ],
        },
      },
    },
    path.join(__dirname, "setup")
  );
  await mockGithub.setup();
});

afterEach(async () => {
  await mockGithub.teardown();
});

test("notify repositories of shared actions update", async () => {
  const moctokit = new Moctokit("http://api.github.com");
  const act = new Act();
  const repoPath = mockGithub.repo.getPath("hey");
  const parentDir = path.dirname(repoPath!);

  // Mocking the repository dispatch manually
  (moctokit.rest.repos as any).dispatch = jest.fn().mockResolvedValue({
    status: 200,
    data: { message: "submodule-updated event dispatched" },
  });

  const result = await act.runJob("pull_update", {
    workflowFile: `${path.dirname(
      repoPath!
    )}/.github/workflows/update-submodule.yml`,
    mockSteps: {
      pull_update: [
        {
          name: "Use Update Submodule Composite Action",
          mockWith: "echo ran semantic-release",
        },
      ],
    },
  });

  // Verify result
  expect(result.length).toBe(1);
  expect(result[0]).toStrictEqual({
    name: "Main actions/checkout@v2",
    status: 0,
    output: "",
  });
  expect(result[1]).toMatchObject({ name: "Main ./build-chain", status: 0 });
  expect(result[1].groups?.length).toBe(12);

  // Check for event dispatch actions
  const group = result[1].groups![1];
  expect(group.name).toBe("Notify repositories");
  expect(group.output).toEqual(
    expect.stringContaining("submodule-updated event dispatched")
  );

  // Verify the dispatch for both repositories
  expect(group.output).toEqual(expect.stringContaining("rindu"));
  expect(group.output).toEqual(expect.stringContaining("blog"));

  expect(result[2]).toStrictEqual({
    name: "Main Check for clones",
    status: 0,
    output: "exist",
  });
});
