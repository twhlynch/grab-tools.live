#!/bin/bash

hash_file="$1"
new_email="$2"

while IFS= read -r commit_hash; do
	if git cat-file -e "$commit_hash^{commit}"; then

		current_author=$(git show -s --format='%an' "$commit_hash")

		git checkout "$commit_hash"
		git commit --amend --author="$current_author <$new_email>" --no-edit

		echo "Updated commit $commit_hash with new email: $new_email"
	else
		echo "Commit $commit_hash does not exist."
	fi
done < "$hash_file"

git checkout -

echo "Success?"