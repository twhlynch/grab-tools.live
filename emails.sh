#!/bin/bash

hash_file="$1"
new_email="$2"

temp_hash_file=$(mktemp)

while IFS= read -r commit_hash; do
	if git cat-file -e "$commit_hash^{commit}"; then

		current_author=$(git show -s --format='%an' "$commit_hash")

		git checkout "$commit_hash"
		git commit --amend --author="$current_author <$new_email>" --no-edit

		new_commit_hash=$(git rev-parse HEAD)
		echo "$commit_hash $new_commit_hash" >> "$temp_hash_file"

		echo "Updated commit $commit_hash with new email: $new_email"
	else
		echo "Commit $commit_hash does not exist."
	fi
done < "$hash_file"

git checkout -

while IFS= read -r line; do
	old_hash=$(echo "$line" | awk '{print $1}')
	new_hash=$(echo "$line" | awk '{print $2}')
	
	git replace "$old_hash" "$new_hash"
	echo "Replaced $old_hash with $new_hash"
done < "$temp_hash_file"

rm "$temp_hash_file"

echo "Success?"
